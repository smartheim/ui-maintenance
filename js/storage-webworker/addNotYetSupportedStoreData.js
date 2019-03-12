
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
      "extensionservice": "org.openhab.addons",
      "label": "Release builds",
      "description": "The main maven repository for openHAB releases",
      "url": "https://dl.bintray.com/openhab/mvn",
      "type": "maven_repository",
      "fixed": true,
      "enabled": false
    },
    {
      "extensionservice": "org.openhab.addons",
      "label": "Milestone builds",
      "description": "openHAB Milestone repository",
      "url": "https://openhab.jfrog.io/openhab/online-repo-milestone/2.5",
      "type": "maven_repository",
      "fixed": true,
      "enabled": true
    },
    {
      "extensionservice": "org.openhab.addons",
      "label": "Legacy OH1 addons",
      "description": "Add-ons in this repository have a newer version already. For compatibility and old installations you might want to enable this however.",
      "url": "mvn:org.openhab.distro/openhab-addons-legacy/%version%/xml/features",
      "type": "karaf_features",
      "fixed": true,
      "enabled": false
    },
    {
      "id": "eclipse_marketplace_rules",
      "label": "Eclipse Marketplace",
      "description": "Bindings, Rule Templates, Voice services on the Eclipse Marketplace.",
      "url": "https://marketplace.eclipse.org/taxonomy/term/4988%2C4396/api/p?client=org.eclipse.smarthome",
      "type": "bundles",
      "fixed": true,
      "enabled": true
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

async function addPersistenceServices(tx) {
  const store = tx.objectStore('persistence-services');
  await store.clear();
  const data = [
    {
      "id": "influxdb",
      "description": "This service allows you to persist and query states using the InfluxDB time series database.",
      "label": "InfluxDB",
      "configDescriptionURI": "persistence:influxdb",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Every update", id: "onupdate" }
      ]
    },
    {
      "id": "jpa",
      "description": "This service allows you to persist state updates using a SQL or NoSQL database through the Java Persistence API",
      "label": "Java Persistence API",
      "configDescriptionURI": "persistence:jpa",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Every update", id: "onupdate" }
      ]
    },
    {
      "id": "dynamodb",
      "description": "This service allows you to persist state updates using the Amazon DynamoDB database. ",
      "label": "Amazon DynamoDB Persistence",
      "configDescriptionURI": "persistence:dynamodb",
      strategies: [
        { label: "Every change", id: "onchange" }
      ]
    },
    {
      "id": "mapdb",
      "description": "The mapdb Persistence Service is based on simple key-value store that only saves the last value. The intention is to use this for restoreOnStartup items because all other persistence options have their drawbacks if values are only needed for reload.",
      "label": "mapdb",
      "configDescriptionURI": "persistence:mapdb",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Restore on startup", id: "restore" }
      ]
    },
    {
      "id": "rrd4j",
      "description": "rrd4j is a round-robin database and does not grow in size - it has a fixed allocated size, which is used. This is accomplished by doing data compression, which means that the older the data is, the less values are available. So while you might have a value every minute for the last 24 hours, you might only have one every day for the last year.",
      "label": "rrd4j",
      "configDescriptionURI": "persistence:rrd4j",
      strategies: [
        { label: "Cron strategy", id: "cron" }
      ]
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
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onchange"]
    },
    {
      "uid": "30179c6a-2a3c-4435-a7ff-c7448e6df17d",
      "annotation": "Allows an overview of when my items updated to a new value",
      "label": "InfluxDB History",
      "serviceid": "influxdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onupdate"]
    },
    {
      "uid": "8c7e5ce1-578c-4ac4-bc9e-fd20ab6be70e",
      "annotation": "Stores all items to mapDB for a later restart",
      "label": "MapDB Store",
      "serviceid": "mapdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onchange"]
    },
    {
      "uid": "66e7b0d9-3de6-479a-9873-a5347878923d",
      "annotation": "Restores all my items on startup",
      "label": "MapDB Restore",
      "serviceid": "mapdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["restore"]
    },
    {
      "uid": "790073db-6a9a-46f8-8ff2-876c37d7afb7",
      "annotation": "Does this and that",
      "label": "rrd4j Charting",
      "serviceid": "rrd4j",
      "items": [],
      "itemPattern": "",
      "strategy": ["cron"]
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

import { iconset } from './notYetSupportedData/iconset'
async function addIconSet(tx) {
  const store = tx.objectStore('icon-set');
  await store.clear();
  for (let d of iconset) await store.add(d);
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
      "description": "Interact with the openHAB REST API",
      "type": "tool"
    },
    {
      "id": "habpanel",
      "image": "./habpanel/tile.png",
      "link": "./habpanel/index.html",
      "label": "HABPanel",
      "description": "HABPanel shines on larger screens like tablets. It is a widget based user interface.",
      "type": "primary"
    },
    {
      "id": "paperui",
      "image": "./paperui/img/dashboardtile.png",
      "link": "./paperui/index.html",
      "label": "Paper UI",
      "description": "The veteran of setup interfaces",
      "type": "legacy"
    }
  ];
  for (let d of data) await store.add(d);
}

import { osgibundles } from './notYetSupportedData/osgibundles'
async function addOSGIbundles(tx) {
  const store = tx.objectStore('bundle-status');
  await store.clear();
  for (let d of osgibundles) await store.add(d);
}

async function addAbout(tx) {
  const store = tx.objectStore('about');
  await store.clear();
  await store.add({
    name: "openHAB",
    version: "2.5M1",
    builddate: Date.now(),
    distribution: {
      name: "openhabian",
      version: "1.4.1",
      url: "https://www.openhab.org/docs/installation/openhabian.html"
    }
  });
}


async function addUserRoles(tx) {
  const store = tx.objectStore('user-roles');
  await store.clear();
  const data = [
    {
      "id": "admin",
      "label": "Administrator",
      "description": "Interact with the openHAB REST API",
      "passwordhash": "123",
      "restEndpoints": [],
      "items": [],
      "itemByNamePattern": ".*",
      "itemByLabelPattern": "",
      "itemByTags": [],
    },
    {
      "id": "grandma",
      "label": "Grandma",
      "description": "Restricted access to kitchen only",
      "passwordhash": "123",
      "restEndpoints": ["items"],
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": ["kitchen"],
    },
  ];
  for (let d of data) await store.add(d);
}

import { semantic } from './notYetSupportedData/semantic'
async function addSemanticTags(tx) {
  const store = tx.objectStore('semantic-tags');
  await store.clear();
  for (let d of semantic) await store.add(d);
}


/**
 * Block live REST request for these tables
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
export const blockLiveDataFromTables = ['manualextensions', 'scripts', 'persistence-services',
  'persistence', 'script-types', "item-types", "item-group-function-types", "extension-repositories",
  "icon-set", "user-interfaces", "bundle-status", 'user-roles', "about", "semantic-tags"];

/**
 * This methods implements hacks!
 * It creates REST endpoints that are not yet in the mainline openHAB.
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
export async function hack_addNotYetSupportedStoreData(db) {
  const tx = db.transaction(blockLiveDataFromTables, 'readwrite');
  addManualExtensions(tx);
  addExtensionRepositories(tx);
  addScripts(tx);
  addPersistenceServices(tx);
  addPersistence(tx);
  addScriptTypes(tx);
  addItemTypes(tx);
  addItemGroupFunctionTypes(tx);
  addIconSet(tx);
  addUserInterfaces(tx);
  addOSGIbundles(tx);
  addUserRoles(tx);
  addAbout(tx);
  addSemanticTags(tx);
  return tx.complete.catch(e => { console.warn("addNotYetSupportedStoreData failed", e); throw e });
}
