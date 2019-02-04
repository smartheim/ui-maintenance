import { openDb, deleteDb } from 'idb';
import { hack_addNotYetSupportedStoreData, blockLiveDataFromTables } from './addNotYetSupportedStoreData';
import { hack_rewriteEntryToNotYetSupportedStoreLayout, hack_rewriteTableToNotYetSupportedStoreLayout } from './rewriteToNotYetSupportedStoreLayout';
import { fetchWithTimeout } from '../../common/fetch';
import { CompareTwoDataSets } from './compareTwoDatasets';
import { tables, tableToId, dbversion } from './openhabStoreLayout';

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

        const refreshStores = [
            { storename: "items", uri: "rest/items" },
            { storename: "things", uri: "rest/things" },
            { storename: "bindings", uri: "rest/bindings" },
            { storename: "thing-types", uri: "rest/thing-types" },
            { storename: "channel-types", uri: "rest/channel-types" }
        ];

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
        const requests = refreshStores.map(item => fetchWithTimeout(this.openhabHost + "/" + item.uri)
            .catch(e => { console.warn("Failed to fetch", this.openhabHost + "/" + item.uri); throw e; })
            .then(response => response.json())
            .then(json => this.initialStoreFill(this.db, item.storename, json, true)));

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
    async dump() {
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
    async sort(storename, criteria, direction) {
        console.log("Sorting request for", storename, criteria, direction);
    }
    async getAll(uri, storename) {
        const tx = this.db.transaction(storename, 'readonly');
        var val = tx.objectStore(storename).getAll();

        return tx.complete.catch(e => {
            console.warn("Failed to read", storename)
            val = null;
        }).then(() => {
            if (this.blockRESTrequest(storename)) return val;
            if (this.cacheStillValid(uri)) {
                console.debug("cache blocked", uri);
                return val;
            }
            const newVal = this.performRESTandNotify(uri)
                .catch(e => { console.warn("Failed to fetch", uri); throw e; })
                .then(json => { if (!Array.isArray(json)) throw new Error("Returned value is not an array"); return json; })
                .then(json => this.replaceStore(this.db, storename, json))
            return val || newVal;
        })
    }
    async get(uri, storename, objectid, id_key) {
        const tx = this.db.transaction(storename, 'readonly');
        var val = tx.objectStore(storename).get(objectid);

        try {
            await tx.complete
        } catch (e) {
            console.warn("Failed to read", storename, objectid)
            val = null;
        };

        if (this.blockRESTrequest(storename)) return val;

        let newVal = this.fetchNewValue(uri, storename, objectid, id_key);
        return val || newVal;
    }

    async fetchNewValue(uri, storename, objectid, id_key) {
        let json;
        try {
            json = await this.performRESTandNotify(uri);
        } catch (e) {
            console.warn("Fetch failed for", uri);
            throw e;
        }
        if (Array.isArray(json)) {
            let found = false;
            if (id_key) {
                for (var item of json) {
                    if (item[id_key] == objectid) {
                        json = item;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                console.warn("Returned value is an array. Couldn't extract single value", json, uri, objectid, id_key)
                throw new Error("Returned value is an array. Couldn't extract single value");
            }
        }
        return await this.insertIntoStore(this.db, storename, json);
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
        switch (data.type) {
            case "ItemAddedEvent":
                newState = JSON.parse(data.payload);
                this.insertIntoStore(this.db, storename, newState);
                return;
            case "ItemUpdatedEvent":
                newState = JSON.parse(data.payload)[0];
                this.insertIntoStore(this.db, storename, newState);
                return;
            case "ItemStateEvent":
                newState = JSON.parse(data.payload);
                this.changeItemState(this.db, storename, topic[2], newState.value);
                return;
            case "ItemRemovedEvent":
                this.removeFromStore(this.db, storename, JSON.parse(data.payload));
                return;
            case "RuleStatusInfoEvent":
                newState = JSON.parse(data.payload);
                this.changeItemState(this.db, storename, topic[2], newState, "status");
                return;
            //Ignore the following events
            case "ItemStateChangedEvent":
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

        this.db = await openDb(hostname, dbversion, db => {
            console.log("Upgrading database to version", dbversion);
            const objs = db.objectStoreNames;
            for (let ojs of objs) {
                db.deleteObjectStore(ojs);
            }
            for (let table of tables) {
                db.createObjectStore(table.id, { keyPath: table.key });
            }
        }).then(db => {
            hack_addNotYetSupportedStoreData(db);
            return db;
        });
        return this.db;
    }


    blockRESTrequest(storename) {
        console.log("block?", this.openhabHost);
        if (this.openhabHost == "demo") return true;
        if (blockLiveDataFromTables.includes(storename)) return true;
        return false;
    }

    performRESTandNotify(uri) {
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
                if (this.connected) {
                    this.connected = false;
                    const message = e.toString();
                    var type = 404;
                    if (message.includes("TypeError") && !message.includes("Failed to fetch")) {
                        type = 4041; // custom error code for Cross-orgin access
                    }
                    console.warn("REST access failed", uri, e);
                    this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type, message } }));
                }
                this.connected = false;
                throw e;
            });
    }

    cacheStillValid(uri) {
        var d = this.lastRefresh[uri];
        return (!!d && (d + this.expireDurationMS > Date.now()));
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
        const key_id = tableToId[storename];
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
        const id_key = tableToId[storename];
        const id = jsonEntry[id_key];
        await store.delete(id);
        this.dispatchEvent(new CustomEvent("storeItemRemoved", { detail: { "value": jsonEntry, "storename": storename } }));
        return null;
    }

    async changeItemState(db, storename, itemid, value, fieldname = "state") {
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
            console.warn("insertIntoStore must be called with an object", jsonEntry);
            return;
        }
        jsonEntry = hack_rewriteEntryToNotYetSupportedStoreLayout(storename, jsonEntry);
        const store = db.transaction(storename, 'readwrite').objectStore(storename);
        const id_key = tableToId[storename];
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