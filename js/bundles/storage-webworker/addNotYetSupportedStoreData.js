async function addManualExtensions(tx) {
    const store = tx.objectStore('manualextensions');
    await store.clear();
    const data = [
        {
            "id": "binding-avmfritz",
            "label": "AVM FRITZ!Box Binding",
            "filepath": "binding-avmfritz-2.4.0.SNAPSHOT.jar",
            "version": "2.4.0.SNAPSHOT",
            "link": "https://www.openhab.org/addons/bindings/avmfritz/",
            "enabled": true,
            "installed": 1546950225013,
            "type": "binding"
        },
        {
            "id": "binding-airvisualnode",
            "label": "AirVisual Node Binding",
            "filepath": "binding-airvisualnode-2.4.0.SNAPSHOT.jar",
            "version": "2.4.0.SNAPSHOT",
            "link": "https://www.openhab.org/addons/bindings/airvisualnode/",
            "enabled": true,
            "installed": 1546950221013,
            "type": "binding"
        },
        {
            "id": "webinterface",
            "label": "Paper UI NG Alpha",
            "filepath": "webinterface-paperui-ng-0.1.zip",
            "version": "0.1",
            "link": "https://davidgraeff.github.io/paperui-ng/",
            "enabled": true,
            "installed": 1546950125013,
            "type": "webinterface"
        }
    ];
    for (let d of data) await store.add(d);
}

async function addScripts(tx) {
    const scriptStore = tx.objectStore('scripts');
    await scriptStore.clear();
    const scripts = [
        {
            "filename": "a_script_file.js",
            "name": "My first rule"
        }
    ];
    for (let d of scripts) await scriptStore.add(d);
}

async function addSchedule(tx) {
    const scheduleStore = tx.objectStore('schedule');
    await scheduleStore.clear();
    const schedule = [
        {
            "editable": true,
            "label": "My wakeup timer",
            "tags": [
                "Lighting"
            ],
            "totalRuns": 5,
            "remainingRuns": null,
            "cronExpression": "0 7 ? * MON-FRI",
            "type": "cron",
            "enabled": true,
            "UID": "timer:3edb5737",
            "lastrun": 1546950225013
        },
        {
            "editable": true,
            "label": "Garden watering",
            "tags": [
                "Lighting"
            ],
            "totalRuns": 17,
            "remainingRuns": null,
            "cronExpression": "0 30 10-13 ? * WED,FRI",
            "type": "cron",
            "enabled": true,
            "UID": "timer:4263ds53",
            "lastrun": 1546950225013
        },
        {
            "editable": true,
            "label": "An absolut timer",
            "tags": [
                "Lighting"
            ],
            "totalRuns": 0,
            "remainingRuns": 1,
            "datetime": "2008-09-15T15:53:00",
            "type": "fixed",
            "enabled": true,
            "UID": "timer:4263ds54",
            "lastrun": 1546950225013
        }
    ];
    for (let d of schedule) await scheduleStore.add(d);
}

async function addPersistenceServices(tx) {
    const store = tx.objectStore('persistence-services');
    await store.clear();
    const data = [
        {
            "id": "influxdb",
            "description": "This service allows you to persist and query states using the InfluxDB time series database.",
            "label": "InfluxDB",
            "configDescriptionURI": "persistence:influxdb"
        },
        {
            "id": "jpa",
            "description": "This service allows you to persist state updates using a SQL or NoSQL database through the Java Persistence API",
            "label": "Java Persistence API",
            "configDescriptionURI": "persistence:jpa"
        },
        {
            "id": "dynamodb",
            "description": "This service allows you to persist state updates using the Amazon DynamoDB database. ",
            "label": "Amazon DynamoDB Persistence",
            "configDescriptionURI": "persistence:dynamodb"
        },
        {
            "id": "mapdb",
            "description": "The mapdb Persistence Service is based on simple key-value store that only saves the last value. The intention is to use this for restoreOnStartup items because all other persistence options have their drawbacks if values are only needed for reload.",
            "label": "mapdb",
            "configDescriptionURI": "persistence:mapdb"
        },
        {
            "id": "rrd4j",
            "description": "rrd4j is a round-robin database and does not grow in size - it has a fixed allocated size, which is used. This is accomplished by doing data compression, which means that the older the data is, the less values are available. So while you might have a value every minute for the last 24 hours, you might only have one every day for the last year.",
            "label": "rrd4j",
            "configDescriptionURI": "persistence:rrd4j"
        }
    ];
    for (let d of data) await store.add(d);
}


async function addPersistence(tx) {
    const store = tx.objectStore('persistence');
    await store.clear();
    const data = [
        {
            "uid": "e7773915-cd05-4376-813f-b35de6a98bf2",
            "annotation": "Used for charting",
            "label": "InfluxDB Charting",
            "serviceid": "influxdb",
            "items": [],
            "stategy": { label: "every change" }
        },
        {
            "uid": "30179c6a-2a3c-4435-a7ff-c7448e6df17d",
            "annotation": "Allows an overview of when my items updated to a new value",
            "label": "InfluxDB History",
            "serviceid": "influxdb",
            "items": [],
            "stategy": { label: "every update" }
        },
        {
            "uid": "8c7e5ce1-578c-4ac4-bc9e-fd20ab6be70e",
            "annotation": "Stores all items to mapDB for a later restart",
            "label": "MapDB Restore",
            "serviceid": "mapdb",
            "items": [],
            "stategy": { label: "every change" }
        },
        {
            "uid": "66e7b0d9-3de6-479a-9873-a5347878923d",
            "annotation": "Restores all my items on startup",
            "label": "MapDB Restore",
            "serviceid": "mapdb",
            "items": [],
            "stategy": { label: "restore on startup" }
        },
        {
            "uid": "790073db-6a9a-46f8-8ff2-876c37d7afb7",
            "annotation": "Does this and that",
            "label": "rrd4j Charting",
            "serviceid": "rrd4j",
            "items": [],
            "stategy": { label: "cron strategy" }
        }
    ];
    for (let d of data) await store.add(d);
}

export async function hack_addNotYetSupportedStoreData(db) {
    const tx = db.transaction(['manualextensions', 'scripts', 'schedule', 'persistence-services', 'persistence'], 'readwrite');
    addManualExtensions(tx);
    addScripts(tx);
    addSchedule(tx);
    addPersistenceServices(tx);
    addPersistence(tx);
    return tx.complete;
}

export const blockLiveDataFromTables = ['manualextensions', 'scripts', 'schedule', 'persistence-services', 'persistence'];