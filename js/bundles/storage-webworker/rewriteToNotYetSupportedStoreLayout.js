import { fetchWithTimeout } from '../../common/fetch';

export function hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry) {
    switch (storename) {
        case "bindings": {
            entry.loglevel = "warn";
            entry.source = "https://github.com/openhab/openhab2-addons/tree/master/addons/binding/org.openhab.binding." + entry.id;
            if (entry.id == "zwave") {
                entry.source = "https://github.com/openhab/org.openhab.binding.zwave/tree/master";
                entry.custompages = [
                    {
                        "uri": "dummydata/mqtt.html",
                        "label": "MQTT Traffic monitor"
                    }
                ]
            }
            else if (entry.id == "mqtt") {
                entry.custompages = [
                    {
                        "uri": "dummydata/mqtt.html",
                        "label": "MQTT Traffic monitor"
                    }
                ]
            }
            break;
        }
        case "extensions": {
            entry.availableVersions = [
                "2.4 - Stable",
                "2.5 - Snapshot"
            ];
            entry.status = entry.installed ? "installed" : "notinstalled";
            delete entry.installed;
            break;
        }
        case "discovery": {
            const id = entry;
            entry = {
                id: id,
                background: id != "network" ? true : false,
                duration: 60,
                activeRemaining: id == "network" ? 40 : 0,
            }
            break;
        }
    }
    return entry;
}

export async function hack_rewriteTableToNotYetSupportedStoreLayout(storename, table, store) {
    if (store.openhabHost == "demo") {
        return table;
    }

    switch (storename) {
        /**
         * The module-types entries do not store their own type (what the heck??).
         * So we need to http GET all three endpoints, for each type one, and compare all
         * entries to those three sets. Tedious.
         */
        case "module-types": {
            let uris = [store.openhabHost + "/rest/module-types?type=action",
            store.openhabHost + "/rest/module-types?type=condition",
            store.openhabHost + "/rest/module-types?type=trigger"];
            let sets = [];
            for (let uri of uris) {
                const response = await fetchWithTimeout(uri);
                const jsonList = await response.json();
                let set = new Set();
                for (let entry of jsonList) set.add(entry.uid);
                sets.push(set);
            }
            for (let entry of table) {
                if (sets[0].has(entry.uid)) {
                    entry.type = "action";
                }
                else if (sets[1].has(entry.uid)) {
                    entry.type = "condition";
                }
                else if (sets[2].has(entry.uid)) {
                    entry.type = "trigger";
                }
            }
            break;
        }
    }
    return table;

}