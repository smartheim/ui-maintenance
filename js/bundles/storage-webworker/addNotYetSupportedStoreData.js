/**
 * This file contains hacks!
 * It contains REST endpoints that are not yet in the mainline openHAB.
 */

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

async function addExtensionRepositories(tx) {
    const scriptStore = tx.objectStore('extension-repositories');
    await scriptStore.clear();
    const scripts = [
        {
            "id": "oh1legacy",
            "label": "Legacy OH1 addons",
            "description": "Add-ons in this repository have a newer version already. For compatibility and old installations you might want to enable this however.",
        },
        {
            "id": "oh1",
            "label": "OH1 addons",
            "description": "Some Add-ons do not have an OH2 version available. Enable the this repository to install those.",
        },
        {
            "id": "eclipse_marketplace_rules",
            "label": "Eclipse Marketplace Rule Templates",
            "description": "Enable this repository to install Rule Templates from the Eclipse Marketplace.",
        },
        {
            "id": "eclipse_marketplace_bindings",
            "label": "Eclipse Marketplace Bindings",
            "description": "Enable this repository to install Bindings from the Eclipse Marketplace.",
        },
        {
            "id": "eclipse_marketplace_voice",
            "label": "Eclipse Marketplace Voice",
            "description": "Enable this repository to install Voice services from the Eclipse Marketplace.",
        },
    ];
    for (let d of scripts) await scriptStore.add(d);
}

async function addScripts(tx) {
    const scriptStore = tx.objectStore('scripts');
    await scriptStore.clear();
    const scripts = [
        {
            "filename": "a_script_file.js",
            "description": "My first rule",
            "mime": "application/javascript",
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

async function addScriptTypes(tx) {
    const store = tx.objectStore('script-types');
    await store.clear();
    const data = [
        {
            "id": "javascript",
            "mime": "application/javascript",
            "extension": "js",
            "label": "Javascript ES6 (Nashorn)",
            "description": ""
        },
        {
            "id": "jython",
            "mime": "application/python",
            "extension": "py",
            "label": "Jython (Python 2.6 dialect)",
            "description": ""
        }
    ];
    for (let d of data) await store.add(d);
}

async function addItemTypes(tx) {
    const store = tx.objectStore('item-types');
    await store.clear();
    const data = [
        {
            id: "Color", label: "Color",
            description: "Color information"
        },
        {
            id: "Contact", label: "Contact",
            description: "Read-only status of contacts, e.g. door/window contacts.",
            group: true,
            allowedStates: ["CLOSED", "OPEN"]
        },
        {
            id: "DateTime", label: "DateTime",
            description: "Stores date and time",
            group: true
        },
        {
            id: "Dimmer", label: "Dimmer",
            description: "Percentage value, typically used for dimmers",
            group: true, percentage: true, number: true,
            commands: ["INCREASE", "DECREASE", "OFF", "ON"]
        },
        {
            id: "Image", label: "Image",
            description: "Binary data of an image"
        },
        {
            id: "Location", label: "Location",
            description: "GPS coordinates"
        },
        {
            id: "Number", label: "Number",
            description: "Values in number format",
            group: true, number: true
        },
        {
            id: "Player", label: "Player",
            description: "Allows control of players (e.g. audio players)",
            allowedStates: ["PLAY", "PAUSE"], commands: ["PLAY", "PAUSE", "STOP"]
        },
        {
            id: "Rollershutter", label: "Rollershutter",
            description: "Roller shutter Item, typically used for blinds",
            group: true, percentage: true, number: true,
            commands: ["INCREASE", "DECREASE", "UP", "DOWN", "STOP", "MOVE", "OFF", "ON"]
        },
        {
            id: "String", label: "String",
            description: "Stores texts"
        },
        {
            id: "Switch", label: "Switch",
            description: "Used for anything that needs to be switched ON and OFF",
            group: true,
            allowedStates: ["ON", "OFF"], commands: ["ON", "OFF"]
        },
        {
            id: "Group", label: "Group",
            description: "Item to nest other items / collect them in groups"
        },
    ];
    for (let d of data) await store.add(d);
}

async function addItemGroupFunctionTypes(tx) {
    const store = tx.objectStore('item-group-function-types');
    await store.clear();
    const data = [
        {
            id: "AND",
            label: "All state S1 ⊶ S1",
            description: "If all members have state S1, this group has state S1 else state S2",
            compatible: [],
            params: [
                { type: "allowedState", label: "S1", description: "State 1" },
                { type: "allowedState", label: "S2", description: "State 2" }
            ]
        },
        {
            id: "NAND",
            label: "All state S1 ⊶ S2",
            description: "If all members have state S1, this group has state S2 else state S1",
            compatible: [],
            params: [
                { type: "allowedState", label: "S1", description: "State 1" },
                { type: "allowedState", label: "S2", description: "State 2" }
            ]
        },
        {
            id: "OR",
            label: "Any state S1 ⊶ S1",
            description: "If any member is state S1, this group has state S1 else state S2",
            compatible: [],
            params: [
                { type: "allowedState", label: "S1", description: "State 1" },
                { type: "allowedState", label: "S2", description: "State 2" }
            ]
        },
        {
            id: "NOR",
            label: "Any state S1 ⊶ S2",
            description: "If any member is state S1, this group has state S2 else state S1",
            compatible: [],
            params: [
                { type: "allowedState", label: "S1", description: "State 1" },
                { type: "allowedState", label: "S2", description: "State 2" }
            ]
        },
        {
            id: "EQUALITY",
            label: "Equal",
            description: "Sets the group state to all members equal state otherwise to UNDEF",
            compatible: [],
        },
        {
            id: "SUM",
            label: "Sum",
            description: "Computes the sum of all group members",
            compatible: ["Rollershutter", "Dimmer", "Number"],
        },
        {
            id: "AVG",
            label: "Average",
            description: "Computes the average of all group members",
            compatible: ["Rollershutter", "Dimmer", "Number"],
        },
        {
            id: "MIN",
            label: "Minimum",
            description: "Computes the minimum of all group members",
            compatible: ["Rollershutter", "Dimmer", "Number"],
        },
        {
            id: "MAX",
            label: "Maximum",
            description: "Computes the maximum of all group members",
            compatible: ["Rollershutter", "Dimmer", "Number"],
        },
        {
            id: "LATEST",
            label: "Latest",
            description: "Computes the latest of all group members",
            compatible: ["DateTime"],
        },
        {
            id: "EARLIEST",
            label: "Earliest",
            description: "Computes the earliest of all group members",
            compatible: ["DateTime"],
        },
        {
            id: "COUNT",
            label: "Count",
            description: "Sets the state to the number of members matching the given regular expression with their states.",
            compatible: [],
            params: [
                { type: "regex", label: "Regex", description: "A regular expression. '.*' for example would match all states." },
            ]
        },
    ];
    for (let d of data) await store.add(d);
}


async function addIconSet(tx) {
    const store = tx.objectStore('icon-set');
    await store.clear();
    const data = [
        "attic",
        "bath",
        "bedroom",
        "cellar",
        "corridor",
        "firstfloor",
        "garage",
        "garden",
        "groundfloor",
        "kitchen",
        "office",
        "terrace",
        "battery",
        "blinds",
        "camera",
        "door",
        "frontdoor",
        "garagedoor",
        "lawnmower",
        "lightbulb",
        "lock",
        "poweroutlet",
        "projector",
        "receiver",
        "screen",
        "siren",
        "wallswitch",
        "whitegood",
        "window",
        "colorpicker",
        "group",
        "rollershutter",
        "slider",
        "switch",
        "text",
        "humidity",
        "moon",
        "rain",
        "snow",
        "sun",
        "sun_clouds",
        "temperature",
        "wind",
        "batterylevel",
        "carbondioxide",
        "colorlight",
        "energy",
        "fire",
        "flow",
        "gas",
        "light",
        "lowbattery",
        "motion",
        "oil",
        "pressure",
        "price",
        "qualityofservice",
        "smoke",
        "soundvolume",
        "temperature",
        "time",
        "water",
        "heating",
        "mediacontrol",
        "movecontrol",
        "zoom",
        "alarm",
        "party",
        "presence",
        "vacation",
        "baby_1",
        "baby_2",
        "baby_3",
        "baby_4",
        "baby_5",
        "baby_6",
        "bedroom_blue",
        "bedroom_orange",
        "bedroom_red",
        "bluetooth",
        "boy_1",
        "boy_2",
        "boy_3",
        "boy_4",
        "boy_5",
        "boy_6",
        "calendar",
        "chart",
        "cinema",
        "cinemascreen",
        "cistern",
        "climate",
        "colorwheel",
        "contact",
        "dryer",
        "error",
        "fan",
        "fan_box",
        "fan_ceiling",
        "faucet",
        "flowpipe",
        "garage_detached",
        "garage_detached_selected",
        "girl_1",
        "girl_2",
        "girl_3",
        "girl_4",
        "girl_5",
        "girl_6",
        "greenhouse",
        "house",
        "incline",
        "keyring",
        "line",
        "man_1",
        "man_2",
        "man_3",
        "man_4",
        "man_5",
        "man_6",
        "microphone",
        "network",
        "niveau",
        "none",
        "outdoorlight",
        "pantry",
        "parents_1_1",
        "parents_1_2",
        "parents_1_3",
        "parents_1_4",
        "parents_1_5",
        "parents_1_6",
        "parents_2_1",
        "parents_2_2",
        "parents_2_3",
        "parents_2_4",
        "parents_2_5",
        "parents_2_6",
        "parents_3_1",
        "parents_3_2",
        "parents_3_3",
        "parents_3_4",
        "parents_3_5",
        "parents_3_6",
        "parents_4_1",
        "parents_4_2",
        "parents_4_3",
        "parents_4_4",
        "parents_4_5",
        "parents_4_6",
        "parents_5_1",
        "parents_5_2",
        "parents_5_3",
        "parents_5_4",
        "parents_5_5",
        "parents_5_6",
        "parents_6_1",
        "parents_6_2",
        "parents_6_3",
        "parents_6_4",
        "parents_6_5",
        "parents_6_6",
        "pie",
        "piggybank",
        "player",
        "poweroutlet_au",
        "poweroutlet_eu",
        "poweroutlet_uk",
        "poweroutlet_us",
        "pump",
        "radiator",
        "recorder",
        "returnpipe",
        "rgb",
        "settings",
        "sewerage",
        "shield",
        "smiley",
        "sofa",
        "softener",
        "solarplant",
        "soundvolume_mute",
        "status",
        "suitcase",
        "sunrise",
        "sunset",
        "temperature_cold",
        "temperature_hot",
        "toilet",
        "video",
        "wardrobe",
        "washingmachine",
        "washingmachine_2",
        "woman_1",
        "woman_2",
        "woman_3",
        "woman_4",
        "woman_5",
        "woman_6",
    ];
    for (let d of data) await store.add(d);
}

async function addUserInterfaces(tx) {
    const store = tx.objectStore('user-interfaces');
    await store.clear();
    const data = [
        {
            "id": "restapidoc",
            "image": "./doc/images/dashboardtile.png",
            "link": "./doc/index.html",
            "label": "REST Api",
            "description": "Interact with the openHAB REST API"
        },
        {
            "id": "habpanel",
            "image": "./habpanel/tile.png",
            "link": "./habpanel/index.html",
            "label": "HABPanel",
            "description": "HABPanel shines on larger screens like tablets. It is a widget based user interface."
        },
        {
            "id": "paperui",
            "image": "./paperui/img/dashboardtile.png",
            "link": "./paperui/index.html",
            "label": "Paper UI",
            "description": "The veteran of setup interfaces"
        }
    ];
    for (let d of data) await store.add(d);
}

async function addOSGIbundles(tx) {
    const store = tx.objectStore('bundle-status');
    await store.clear();
    const data = [
        {
            "id": 20,
            "state": "Active",
            "lvl": 80,
            "version": "5.3.1.201602281253",
            "name": "OSGi JAX-RS Connector"
        },
        {
            "id": 21,
            "state": "Active",
            "lvl": 80,
            "version": "2.7.0.v20170129-0911",
            "name": "Gson: Google Json Library for Java"
        },
        {
            "id": 23,
            "state": "Active",
            "lvl": 80,
            "version": "3.0.0.v201312141243",
            "name": "Google Guice (No AOP)"
        },
        {
            "id": 26,
            "state": "Active",
            "lvl": 80,
            "version": "3.5.4",
            "name": "JmDNS"
        },
        {
            "id": 28,
            "state": "Active",
            "lvl": 80,
            "version": "1.0.0",
            "name": "Units of Measurement API"
        },
        {
            "id": 30,
            "state": "Active",
            "lvl": 80,
            "version": "1.1.0.Final",
            "name": "Bean Validation API"
        },
        {
            "id": 31,
            "state": "Active",
            "lvl": 80,
            "version": "2.0.1",
            "name": "javax.ws.rs-api"
        },
        {
            "id": 32,
            "state": "Active",
            "lvl": 80,
            "version": "3.2.0.v201101311130",
            "name": "ANTLR Runtime"
        },
        {
            "id": 35,
            "state": "Active",
            "lvl": 80,
            "version": "3.2.1",
            "name": "Commons Collections"
        },
        {
            "id": 36,
            "state": "Active",
            "lvl": 80,
            "version": "1.1",
            "name": "Commons Exec"
        },
        {
            "id": 37,
            "state": "Active",
            "lvl": 80,
            "version": "2.2.0",
            "name": "Commons IO"
        },
        {
            "id": 38,
            "state": "Active",
            "lvl": 80,
            "version": "2.6",
            "name": "Commons Lang"
        },
        {
            "id": 47,
            "state": "Active",
            "lvl": 80,
            "version": "4.2.1",
            "name": "Apache Karaf :: OSGi Services :: Event"
        },
        {
            "id": 63,
            "state": "Active",
            "lvl": 80,
            "version": "4.6.0",
            "name": "Apache XBean OSGI Bundle Utilities"
        },
        {
            "id": 64,
            "state": "Active",
            "lvl": 80,
            "version": "4.6.0",
            "name": "Apache XBean :: Classpath Resource Finder"
        },
        {
            "id": 65,
            "state": "Active",
            "lvl": 80,
            "version": "2.12.0.v20160420-0247",
            "name": "EMF Common"
        },
        {
            "id": 66,
            "state": "Active",
            "lvl": 80,
            "version": "2.12.0.v20160420-0247",
            "name": "EMF Ecore"
        },
        {
            "id": 67,
            "state": "Active",
            "lvl": 80,
            "version": "2.11.0.v20160420-0247",
            "name": "EMF Change Model"
        },
        {
            "id": 68,
            "state": "Active",
            "lvl": 80,
            "version": "2.12.0.v20160420-0247",
            "name": "EMF XML/XMI Persistence"
        },
        {
            "id": 69,
            "state": "Active",
            "lvl": 80,
            "version": "3.8.0.v20160509-1230",
            "name": "Common Eclipse Runtime"
        },
        {
            "id": 70,
            "state": "Active",
            "lvl": 80,
            "version": "3.6.100.v20160223-2218",
            "name": "Extension Registry Support"
        },
        {
            "id": 80,
            "state": "Active",
            "lvl": 80,
            "version": "9.4.11.v20180605",
            "name": "Jetty :: Proxy"
        },
        {
            "id": 94,
            "state": "Active",
            "lvl": 80,
            "version": "0.4.1.v20180515-1321",
            "name": "org.eclipse.lsp4j"
        },
        {
            "id": 95,
            "state": "Active",
            "lvl": 80,
            "version": "0.4.1.v20180515-1321",
            "name": "org.eclipse.lsp4j.jsonrpc"
        },
        {
            "id": 96,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Config Core"
        },
        {
            "id": 97,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Configuration Discovery"
        },
        {
            "id": 98,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Configuration mDNS Discovery"
        },
        {
            "id": 99,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Config Dispatcher"
        },
        {
            "id": 100,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Config XML"
        },
        {
            "id": 101,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core"
        },
        {
            "id": 102,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Audio"
        },
        {
            "id": 103,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Binding XML"
        },
        {
            "id": 104,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core ID"
        },
        {
            "id": 105,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Persistence"
        },
        {
            "id": 106,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Scheduler Service"
        },
        {
            "id": 107,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Thing"
        },
        {
            "id": 108,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Thing XML"
        },
        {
            "id": 109,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Transformation Service"
        },
        {
            "id": 110,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core Voice"
        },
        {
            "id": 111,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Console"
        },
        {
            "id": 112,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Console for OSGi runtime Karaf"
        },
        {
            "id": 113,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome JavaSound I/O, Fragments: 180"
        },
        {
            "id": 114,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Monitor"
        },
        {
            "id": 115,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Net I/O Bundle"
        },
        {
            "id": 116,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome REST Interface Bundle"
        },
        {
            "id": 117,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Core REST API"
        },
        {
            "id": 118,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome REST mDNS Announcer"
        },
        {
            "id": 119,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome REST Interface JAX-RS optimization Bundle"
        },
        {
            "id": 120,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Sitemap REST API"
        },
        {
            "id": 121,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome SSE REST API"
        },
        {
            "id": 122,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Voice REST API"
        },
        {
            "id": 123,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Bonjour/MDS Service Discovery Bundle"
        },
        {
            "id": 124,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Web Audio Support"
        },
        {
            "id": 125,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Model Core"
        },
        {
            "id": 126,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Item Model"
        },
        {
            "id": 127,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Item Model IDE"
        },
        {
            "id": 128,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Item Model Runtime"
        },
        {
            "id": 129,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Language Server"
        },
        {
            "id": 130,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Persistence Model"
        },
        {
            "id": 131,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Persistence Model IDE"
        },
        {
            "id": 132,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Persistence Runtime"
        },
        {
            "id": 133,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Rule Model"
        },
        {
            "id": 134,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Rule Model IDE"
        },
        {
            "id": 135,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Rule Runtime"
        },
        {
            "id": 136,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Script"
        },
        {
            "id": 137,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Script Model IDE"
        },
        {
            "id": 138,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Script Runtime"
        },
        {
            "id": 139,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Sitemap Model"
        },
        {
            "id": 140,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Sitemap Model IDE"
        },
        {
            "id": 141,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Sitemap Runtime"
        },
        {
            "id": 142,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Thing Model"
        },
        {
            "id": 143,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Thing Model IDE"
        },
        {
            "id": 144,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Thing Model Runtime"
        },
        {
            "id": 145,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Json Storage Service"
        },
        {
            "id": 146,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome UI"
        },
        {
            "id": 147,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome UI Icons"
        },
        {
            "id": 148,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Classic IconSet"
        },
        {
            "id": 149,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1629",
            "name": "Xtend Runtime Library"
        },
        {
            "id": 150,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1629",
            "name": "Xtend Macro Interfaces"
        },
        {
            "id": 151,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1821",
            "name": "Xtext"
        },
        {
            "id": 152,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1833",
            "name": "Xtext Common Types"
        },
        {
            "id": 153,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1821",
            "name": "Xtext IDE Core"
        },
        {
            "id": 154,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1821",
            "name": "Xtext Utility"
        },
        {
            "id": 155,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1833",
            "name": "Xbase Model"
        },
        {
            "id": 156,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1833",
            "name": "Xbase Generic IDE Services"
        },
        {
            "id": 157,
            "state": "Active",
            "lvl": 80,
            "version": "2.14.0.v20180522-1629",
            "name": "Xbase Runtime Library"
        },
        {
            "id": 172,
            "state": "Active",
            "lvl": 80,
            "version": "1.9.6",
            "name": "MIME streaming extension"
        },
        {
            "id": 174,
            "state": "Active",
            "lvl": 80,
            "version": "6.2.0",
            "name": "org.objectweb.asm"
        },
        {
            "id": 175,
            "state": "Active",
            "lvl": 80,
            "version": "6.2.0",
            "name": "org.objectweb.asm.commons"
        },
        {
            "id": 176,
            "state": "Active",
            "lvl": 80,
            "version": "6.2.0",
            "name": "org.objectweb.asm.tree"
        },
        {
            "id": 177,
            "state": "Active",
            "lvl": 90,
            "version": "2.4.0.201810032130",
            "name": "openHAB Core"
        },
        {
            "id": 178,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "openHAB Karaf Integration"
        },
        {
            "id": 180,
            "state": "Resolved",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "openHAB Sound Support, Hosts: 113"
        },
        {
            "id": 181,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "openHAB Dashboard UI"
        },
        {
            "id": 186,
            "state": "Active",
            "lvl": 80,
            "version": "1.0.2",
            "name": "Units of Measurement Common Library"
        },
        {
            "id": 187,
            "state": "Active",
            "lvl": 80,
            "version": "1.0.8",
            "name": "Units of Measurement Implementation for Java SE"
        },
        {
            "id": 188,
            "state": "Active",
            "lvl": 80,
            "version": "3.3.0",
            "name": "Commons Net"
        },
        {
            "id": 189,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Basic UI, Fragments: 192"
        },
        {
            "id": 190,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Paper UI, Fragments: 194"
        },
        {
            "id": 191,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "Hue Emulation Service"
        },
        {
            "id": 192,
            "state": "Resolved",
            "lvl": 75,
            "version": "2.4.0.201810032130",
            "name": "openHAB Basic UI Fragment, Hosts: 189"
        },
        {
            "id": 193,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "HABPanel User Interface"
        },
        {
            "id": 194,
            "state": "Resolved",
            "lvl": 75,
            "version": "2.4.0.201810032130",
            "name": "openHAB Paper UI Theme Fragment, Hosts: 190"
        },
        {
            "id": 198,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation API"
        },
        {
            "id": 199,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation commands"
        },
        {
            "id": 200,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Core"
        },
        {
            "id": 201,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Module Core"
        },
        {
            "id": 202,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Media Modules"
        },
        {
            "id": 203,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Module Script"
        },
        {
            "id": 204,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Script Globals"
        },
        {
            "id": 205,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Script RuleSupport"
        },
        {
            "id": 206,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Module Timer"
        },
        {
            "id": 207,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation GSON Parser"
        },
        {
            "id": 208,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation Providers"
        },
        {
            "id": 209,
            "state": "Active",
            "lvl": 80,
            "version": "0.10.0.201809271800",
            "name": "Eclipse SmartHome Automation REST API"
        },
        {
            "id": 239,
            "state": "Installed",
            "lvl": 80,
            "version": "0.10.0.201810051534",
            "name": "Eclipse SmartHome MQTT Binding"
        },
        {
            "id": 240,
            "state": "Installed",
            "lvl": 80,
            "version": "0.10.0.201810051534",
            "name": "Eclipse SmartHome Embedded Mqtt Broker"
        },
        {
            "id": 241,
            "state": "Installed",
            "lvl": 80,
            "version": "0.10.0.201810051534",
            "name": "Eclipse SmartHome MQTT Thing Binding"
        },
        {
            "id": 242,
            "state": "Installed",
            "lvl": 80,
            "version": "0.10.0.201810051534",
            "name": "Eclipse SmartHome MQTT Transport Bundle"
        },
        {
            "id": 243,
            "state": "Active",
            "lvl": 80,
            "version": "1.1.1.201605111122",
            "name": "Swagger Provider"
        },
        {
            "id": 244,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "Jackson-annotations"
        },
        {
            "id": 245,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "Jackson-core"
        },
        {
            "id": 246,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "jackson-databind"
        },
        {
            "id": 247,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "Jackson-dataformat-XML"
        },
        {
            "id": 248,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "Jackson-dataformat-YAML"
        },
        {
            "id": 249,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.5",
            "name": "Jackson-module-JAXB-annotations"
        },
        {
            "id": 250,
            "state": "Active",
            "lvl": 80,
            "version": "18.0.0",
            "name": "Guava: Google Core Libraries for Java"
        },
        {
            "id": 251,
            "state": "Active",
            "lvl": 80,
            "version": "1.5.8",
            "name": "swagger-annotations"
        },
        {
            "id": 252,
            "state": "Active",
            "lvl": 80,
            "version": "1.5.8",
            "name": "swagger-core"
        },
        {
            "id": 253,
            "state": "Active",
            "lvl": 80,
            "version": "1.5.8",
            "name": "swagger-jaxrs"
        },
        {
            "id": 254,
            "state": "Active",
            "lvl": 80,
            "version": "1.5.8",
            "name": "swagger-models"
        },
        {
            "id": 255,
            "state": "Active",
            "lvl": 80,
            "version": "3.19.0.GA",
            "name": "Javassist"
        },
        {
            "id": 256,
            "state": "Active",
            "lvl": 80,
            "version": "3.2.1",
            "name": "Apache Commons Lang"
        },
        {
            "id": 259,
            "state": "Active",
            "lvl": 80,
            "version": "2.4.0.201810032130",
            "name": "openHAB REST Documentation"
        },
        {
            "id": 260,
            "state": "Active",
            "lvl": 80,
            "version": "0.9.10.v20160429-1435",
            "name": "reflections (wrap)"
        },
        {
            "id": 261,
            "state": "Active",
            "lvl": 80,
            "version": "3.1.4",
            "name": "Stax2 API"
        },
        {
            "id": 262,
            "state": "Active",
            "lvl": 80,
            "version": "1.5.8.v20160511-1038",
            "name": "swagger-jersey2-jaxrs (wrap)"
        },
        {
            "id": 263,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome JavaScript Transformation Service"
        },
        {
            "id": 270,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome XPath Transformation Service"
        },
        {
            "id": 271,
            "state": "Active",
            "lvl": 80,
            "version": "2.1.0",
            "name": "json-path"
        },
        {
            "id": 272,
            "state": "Active",
            "lvl": 80,
            "version": "2.2",
            "name": "json-smart"
        },
        {
            "id": 273,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome JSonPath Transformation Service"
        },
        {
            "id": 274,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome RegEx Transformation Service"
        },
        {
            "id": 275,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome Exec Transformation Service"
        },
        {
            "id": 276,
            "state": "Active",
            "lvl": 75,
            "version": "0.10.0.201812160950",
            "name": "Eclipse SmartHome Map Transformation Service"
        }
    ];
    for (let d of data) await store.add(d);
}

export const blockLiveDataFromTables = ['manualextensions', 'scripts', 'schedule', 'persistence-services',
    'persistence', 'script-types', "item-types", "item-group-function-types", "extension-repositories",
    "icon-set", "user-interfaces", "bundle-status"];

export async function hack_addNotYetSupportedStoreData(db) {
    const tx = db.transaction(blockLiveDataFromTables, 'readwrite');
    addManualExtensions(tx);
    addExtensionRepositories(tx);
    addScripts(tx);
    addSchedule(tx);
    addPersistenceServices(tx);
    addPersistence(tx);
    addScriptTypes(tx);
    addItemTypes(tx);
    addItemGroupFunctionTypes(tx);
    addIconSet(tx);
    addUserInterfaces(tx);
    addOSGIbundles(tx);
    return tx.complete;
}
