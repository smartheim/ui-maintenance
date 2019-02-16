import { openDb } from 'idb';
import { hack_addNotYetSupportedStoreData, blockLiveDataFromTables } from './addNotYetSupportedStoreData';
import { hack_rewriteEntryToNotYetSupportedStoreLayout, hack_rewriteTableToNotYetSupportedStoreLayout } from './rewriteToNotYetSupportedStoreLayout';
import { fetchWithTimeout, FetchError } from '../../common/fetch';
import { CompareTwoDataSets } from './compareTwoDatasets';
import { tables, tableIDtoEntry, dbversion } from './openhabStoreLayout';

/**
 * This is the frontends backend storage / cache for the OH REST interface. It is implemented
 * in a state-while-revalidate strategy, so for each get/getAll we first return what we have
 * in the database and perform a REST request as well. The REST response is inserted into the
 * database asynchronously at receive time and if any changes are detected, those are
 * propagated via events.
 * 
 * A connection to the Server-Send-Events endpoint is also established (/rest/events). Received
 * changes are also inserted into the database and propagated via events.
 * 
 * ## Events
 * 
 * The following events are dispatched:
 * 
 * - "connectionEstablished"
 * - "connectionLost"
 * - "storeItemChanged" (Event details: value, storename)
 * - "storeItemAdded" (Event details: value, storename)
 * - "storeItemRemoved" (Event details: value, storename)
 * - "storeChanged" (Event details: value, storename)
 * 
 * ## Sorting / Filtering
 * 
 * Sorting / Filtering / Limiting is not performed in here, because indexed DB does not provide
 * those features. Those operations are performed on a full getAll() data set. Find it performed in "index.js".
 * 
 * ## Change detection / Diffing
 * 
 * If we first return a cached list of items in `getAll` and soon after notify about the received list of items
 * we cause double work for the Views. To implement the state-while-revalidate strategy in a more optimal
 * way, we perform a change-detection between the received list of items and the stored one.
 * 
 * A received REST response might have json properties stored in a different order than what we have
 * in the database. A naive object comparision will always find the cache and REST response to be different.
 * 
 * Therefore received data and cached data are diff'ed by hand, see `CompareTwoDataSets`.
 * That way we can tell the view exactly which item in a list of items has changed.
 * 
 * In average that leads to a fast retrival of data on a `get` and `getAll` call and one or
 * two notifications afterwards about a changed single item in the potentially huge list.
 * 
 * **TODO:** This store class contains the indexedDB interface ("get","getAll") code as well
 * as http database refresh code ("performRESTandNotify" etc). To honour separation of
 * concerns this should be split into those two parts.
 */
export class StateWhileRevalidateStore extends EventTarget {
    constructor() {
        super();
        this.activeRESTrequests = {};
        this.connected = false;
        this.throttleTimeMS = 2000; // Don't request the same REST url again for this throttle time
        this.expireDurationMS = 1000 * 60 * 60; // 1 hour cache for `getAll`
        this.lastRefresh = {}; // Will contain entries like url:time where time is Date.now()-like.
    }
    dispose() {
        this.activeRESTrequests = {};
        if (this.evtSource) { this.evtSource.onerror = null; this.evtSource.onmessage = null; this.evtSource.close(); }
        if (this.db) {
            db.close();
            delete this.db;
        };
    }

    /**
     * Waits for the database to be ready, refreshes some REST endpoints and starts Server-Send-Events
     * Start Server Send Events.
     * 
     * Return a promise that resolves to true on a successful connection and an Error otherwise.
     */
    async reconnect(openhabHost) {
        if (this.openhabHost != openhabHost) {
            await this.connectToDatabase(openhabHost);
            this.openhabHost = openhabHost;
        }

        this.activeRESTrequests = {};

        if (this.evtSource) { this.evtSource.onerror = null; this.evtSource.onmessage = null; this.evtSource.close(); }

        if (openhabHost == "demo") {
            return fetchWithTimeout("../dummydata/demodata.json")
                .then(response => response.json())
                .then(async json => {
                    const stores = Object.keys(json);
                    for (let storename of stores) {
                        await this.initialStoreFill(this.db, storename, json[storename], false);
                    }
                    this.connected = true;
                    this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: openhabHost }));
                    return true;
                }).catch(e => {
                    this.connected = false;
                    this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type: 404, message: e.toString() } }));
                    throw e;
                });
        }

        // Fetch all endpoints in parallel, replace the stores with the received data
        const requests = tables
            .filter(item => item.onstart)
            .map(item => fetchWithTimeout(this.openhabHost + "/" + item.uri)
                .catch(e => { console.warn("Failed to fetch", this.openhabHost + "/" + item.uri); throw e; })
                .then(response => response.json())
                .then(json => this.initialStoreFill(this.db, item.id, json, true))
                .catch(e => { console.warn("Failed to fill", item.id); throw e; })
            );

        // Wait for all promises to complete and start server-send-events
        return Promise.all(requests).then(() => {
            this.evtSource = new EventSource(openhabHost + "/rest/events");
            this.evtSource.onmessage = this.sseMessageReceived.bind(this);
            this.evtSource.onerror = this.sseMessageError.bind(this);
        }).then(() => {
            this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: openhabHost }));
            this.connected = true;
            return true;
        }).catch(e => {
            this.connected = false;
            const message = e.toString();
            var type = 404;
            if (message.includes("TypeError") && !message.includes("Failed to fetch")) {
                type = 4041; // custom error code for Cross-orgin access
            }
            this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type, message } }));
            throw e;
        });
    }
    /**
     * First retrieve fresh data for all tables, then dump the entire indexeddb.
     */
    async dump() {
        const requests = tables.filter(item => item.uri !== undefined && !item.urlsuffix);
        for (let item of requests) {
            await this.getAll(item.id, { force: true });
        }

        let thingTypes = await this.getAll("thing-types", { force: true });
        for (let thingType of thingTypes) {
            await this.get("thing-types-extended", thingType.UID, { force: true });
        }

        let bindings = await this.getAll("bindings", { force: true });
        for (let binding of bindings) {
            await this.get("binding-config", binding.id, { force: true });
        }

        let services = await this.getAll("services", { force: true });
        for (let service of services) {
            await this.get("service-config", service.id, { force: true });
        }

        var dumpobject = {};
        const stores = tables.map(e => e.id);
        const tx = this.db.transaction(stores, 'readonly');
        for (let store of stores) {
            dumpobject[store] = await tx.objectStore(store).getAll();
        }
        return dumpobject;
    }

    async configure(expireDurationMS, throttleTimeMS) {
        this.throttleTimeMS = throttleTimeMS;
        this.expireDurationMS = expireDurationMS;
        return true;
    }

    async getAll(storename, options) {
        const tx = this.db.transaction(storename, 'readonly');
        let val = tx.objectStore(storename).getAll();

        try {
            await tx.complete
        } catch (e) {
            console.warn("Failed to read", storename, objectid)
            val = null;
        };

        if (this.blockRESTrequest(storename))
            return val;

        const uri = tableIDtoEntry[storename].uri;
        if (!uri) {
            console.warn("No URI for", storename);
            throw new Error("No URI for " + storename);
        }

        if (this.cacheStillValid(uri)) {
            return val;
        }

        // Return cached value but also request a new value
        const newVal = this.performRESTandNotify(uri)
            .catch(e => { console.warn("Failed to fetch", uri); throw e; })
            .then(json => { if (!Array.isArray(json)) throw new Error("Returned value is not an array"); return json; })
            .then(json => this.replaceStore(this.db, storename, json))

        if (options.force) { // forced: if no cached OR empty cache value, return http promise
            if (!val || val.length == 0) return newVal;
        }
        return val || newVal; // If no cached value return http promise
    }

    async get(storename, objectid, options) {
        if (!objectid) throw new Error("No object id set for " + storename);
        const tx = this.db.transaction(storename, 'readonly');
        var val = tx.objectStore(storename).get(objectid);

        const tableLayout = tableIDtoEntry[storename];

        val = this.unwrapIfRequired(tableLayout, val);

        try {
            await tx.complete
        } catch (e) {
            console.warn("Failed to read", storename, objectid)
            val = null;
        };

        if (this.blockRESTrequest(storename))
            return val;

        let uri = tableLayout.uri;
        if (!uri) {
            console.warn("No URI for", storename);
            throw new Error("No URI for " + storename);
        }

        if (tableLayout.singleRequests !== false) {
            uri += "/" + objectid;
        }

        if (tableLayout.urlsuffix) {
            uri += tableLayout.urlsuffix;
        }

        if (this.cacheStillValid(uri)) {
            return val;
        }

        // Return cached value but also request a new value. If cached==null return only new value
        let newVal = this.performRESTandNotify(uri, false)
            .catch(e => { console.warn("Fetch failed for", uri); throw e; })
            .then(json => tableLayout.singleRequests === false ? this.extractFromArray(storename, objectid, json) : json)
            .then(json => this.insertIntoStore(this.db, storename, this.wrapIfRequired(tableLayout, objectid, json)))
            .then(json => this.unwrapIfRequired(tableLayout, json));

        if (options.force) { // forced: if no cached OR empty cache value, return http promise
            if (!val || val[tableLayout.key] != objectid) return newVal;
        }
        return val || newVal; // If no cached value return http promise
    }

    wrapIfRequired(tableLayout, objectid, json) {
        if (tableLayout.wrapkey) {
            let r = { id: objectid };
            r[tableLayout.wrapkey] = json;
            console.log("wrapIfRequired", json, r);
            return r;
        }
        return json;
    }

    unwrapIfRequired(tableLayout, json) {
        if (json && tableLayout.wrapkey && json.id) {
            return json[tableLayout.wrapkey];
        }
        return json;
    }

    extractFromArray(storename, objectid, json) {
        if (!Array.isArray(json)) return json;

        const id_key = tableIDtoEntry[storename].key;
        if (!id_key) {
            console.warn("No ID known for", storename);
            throw new Error("No ID known for " + storename);
        }

        for (var item of json) {
            if (item[id_key] == objectid) {
                return item;
            }
        }
        console.warn("Returned value is an array. Couldn't extract single value", json, uri, objectid, id_key)
        throw new Error("Returned value is an array. Couldn't extract single value");
    }

    sseMessageReceived(e) {
        const data = JSON.parse(e.data);
        if (!data || !data.payload || !data.type || !data.topic) {
            console.warn("SSE has unknown format", data.type, data.topic, data.payload);
            return;
        }
        const topic = data.topic.split("/");
        const storename = topic[1];
        let newState;
        console.debug("SSE", data);
        switch (data.type) {
            // -- Added --
            case "ItemAddedEvent":
            case "RuleAddedEvent":
                newState = JSON.parse(data.payload);
                this.insertIntoStore(this.db, storename, newState);
                return;
            // -- Updated --
            case "ItemUpdatedEvent":
                newState = JSON.parse(data.payload)[0];
                this.insertIntoStore(this.db, storename, newState);
                return;
            // -- Removed --
            case "ItemRemovedEvent":
            case "RuleRemovedEvent":
                this.removeFromStore(this.db, storename, JSON.parse(data.payload));
                return;
            // -- State info changed --
            case "ItemStateEvent":
                newState = JSON.parse(data.payload);
                this.changeItemState(this.db, storename, topic[2], newState.value, "state");
                return;
            case "RuleStatusInfoEvent":
                newState = JSON.parse(data.payload);
                this.changeItemState(this.db, storename, topic[2], newState, "status");
                return;
            // -- Ignored events
            case "ItemStateChangedEvent":
            case "ItemStatePredicatedEvent":
            case "ItemCommandEvent":
                return;
        }
        console.warn("Unhandled SSE", data);
    }

    sseMessageError(e) {
        // The server-send-event part of openHAB is crap unfortunately and we will receive a lot
        // of disconnections. For OH3 websockets would be awesome, I guess.
        //console.log("sse error", e);
    }

    async connectToDatabase(hostname) {
        if (this.db) {
            this.db.close();
            delete this.db;
        }

        let hasPerformedUpdate = false;
        this.db = await openDb(hostname, dbversion, db => {
            console.log("Upgrading database to version", dbversion);
            hasPerformedUpdate = true;
            const objs = db.objectStoreNames;
            for (let ojs of objs) {
                db.deleteObjectStore(ojs);
            }
            for (let table of tables) {
                if (table.key) db.createObjectStore(table.id, { keyPath: table.key });
                else db.createObjectStore(table.id, { autoIncrement: true });
            }
        }).then(async db => {
            if (hasPerformedUpdate) await hack_addNotYetSupportedStoreData(db);
            return db;
        });
        return this.db;
    }

    /**
     * Returns true if a http request for a specific store should be blocked.
     * Useful for stores that have no direct REST endpoints like design study
     * invented ones.
     * 
     * This method always returns true if `openhabHost` is "demo".
     * 
     * @param {String} storename The store name
     */
    blockRESTrequest(storename) {
        if (this.openhabHost == "demo") return true;
        if (blockLiveDataFromTables.includes(storename)) return true;
        return false;
    }

    performRESTandNotify(uri, disconnectIfFail = true) {
        const alreadyRunning = this.activeRESTrequests[uri];
        if (alreadyRunning) return alreadyRunning;
        return this.activeRESTrequests[uri] = fetchWithTimeout(this.openhabHost + "/" + uri)
            .then(response => {
                console.debug("Got new value", this.openhabHost + "/" + uri);
                if (!this.connected) {
                    this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: this.openhabHost }));
                    this.connected = true;
                }
                delete this.activeRESTrequests[uri];
                this.lastRefresh[uri] = Date.now();
                return response;
            })
            .then(response => response.json())
            .catch(e => {
                if (!(e instanceof FetchError) && !disconnectIfFail && this.connected) {
                    this.connected = false;
                    const message = e.toString();
                    var type = 404;
                    if (message.includes("TypeError") && !message.includes("Failed to fetch")) {
                        type = 4041; // custom error code for Cross-orgin access
                    }
                    console.warn("REST access failed", uri, e);
                    this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type, message } }));
                }
                throw e;
            });
    }

    cacheStillValid(uri) {
        const d = this.lastRefresh[uri];
        const r = (!!d && (d + this.expireDurationMS > Date.now()));
        if (r) console.log("Cache only response for", uri);
        return r;
    }

    async initialStoreFill(db, storename, jsonList, requireRewrite) {
        const tx = db.transaction(storename, 'readwrite');
        const store = tx.objectStore(storename);
        await store.clear();
        for (let entry of jsonList) {
            if (requireRewrite) entry = hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry);
            try {
                await store.add(entry);
            } catch (e) {
                console.warn("Failed to add to", storename, entry)
                throw e;
            }
        }
        await tx.complete.catch(e => {
            console.warn("Failed to replaceStore", storename);
            throw e;
        });
    }

    async replaceStore(db, storename, jsonList) {
        jsonList = await hack_rewriteTableToNotYetSupportedStoreLayout(storename, jsonList, this);
        const tx = db.transaction(storename, 'readwrite');
        const store = tx.objectStore(storename);
        const key_id = tableIDtoEntry[storename].key;
        const compare = new CompareTwoDataSets(key_id, storename, await store.getAll(), jsonList);

        // Clear and add entry per entry
        await store.clear();
        for (let entry of jsonList) {
            await store.add(hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry));
            compare.compareNewAndOld(entry);
        }
        await tx.complete.catch(e => {
            console.warn("Failed to replaceStore", storename);
            throw e;
        });
        if (compare.ok) {
            if (compare.listOfUnequal.length == 0) console.debug("No data changed");
            for (let value of compare.listOfUnequal) {
                this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { value, storename } }));
            }
        }

        // Refetch the data set to have the list in the same order as before for making it easier for
        // Vue to match existing DOM nodes. Maybe it doesn't matter.. Has to be decided.
        let value = await db.transaction(storename, 'readonly').objectStore(storename).getAll();
        if (!compare.ok) {
            this.dispatchEvent(new CustomEvent("storeChanged", { detail: { value, storename } }));
        }
        return value;
    }

    async removeFromStore(db, storename, jsonEntry) {
        if (!jsonEntry || typeof jsonEntry !== 'object' || jsonEntry.constructor !== Object) {
            console.warn("insertIntoStore must be called with an object", jsonEntry);
            return;
        }
        const store = db.transaction(storename, 'readwrite').objectStore(storename);
        const id_key = tableIDtoEntry[storename].key;
        const id = jsonEntry[id_key];
        await store.delete(id);
        this.dispatchEvent(new CustomEvent("storeItemRemoved", { detail: { "value": jsonEntry, "storename": storename } }));
        return null;
    }

    async changeItemState(db, storename, itemid, value, fieldname) {
        const store = db.transaction(storename, 'readwrite').objectStore(storename);
        var item = await store.get(itemid);
        if (!item) {
            console.info("changeItemState: Item does not exist", itemid);
            return;
        }
        item[fieldname] = value;
        await store.put(item);
        this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { "value": item, "storename": storename } }));
    }
    async insertIntoStore(db, storename, jsonEntry) {
        if (!jsonEntry || typeof jsonEntry !== 'object' || jsonEntry.constructor !== Object) {
            console.warn("insertIntoStore must be called with an object", storename, jsonEntry);
            return;
        }
        jsonEntry = hack_rewriteEntryToNotYetSupportedStoreLayout(storename, jsonEntry);
        const store = db.transaction(storename, 'readwrite').objectStore(storename);
        const id_key = tableIDtoEntry[storename].key;
        var old = await store.get(jsonEntry[id_key]);
        await store.put(jsonEntry);
        if (!old) {
            this.dispatchEvent(new CustomEvent("storeItemAdded", { detail: { "value": jsonEntry, "storename": storename } }));
        } else if (JSON.stringify(old) != JSON.stringify(jsonEntry)) {
            this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { "value": jsonEntry, "storename": storename } }));
        }
        return jsonEntry;
    }
}