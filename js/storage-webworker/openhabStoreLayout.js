import VirtualThingChannels from './virtual-stores/thing-channel';

/**
 * The following table describes all available stores for the model (database). Most
 * of the stores correspond to a REST endpoint. If a rest endpoint does not allow
 * indiviual object requests, it is annotated with "singleRequests: false".
 * 
 * Some stores are pre-loaded on application start, annotated with "onstart: true".
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const tables = [
  { id: "bindings", uri: "rest/bindings", key: "id", singleRequests: false, onstart: true, label: "Bindings" },// ALTERED
  { id: "binding-config", uri: "rest/bindings", urlsuffix: "/config", wrapkey: "config", key: "id" },
  { id: "channel-types", uri: "rest/channel-types", key: "UID", onstart: true },
  { id: "config-descriptions", uri: "rest/config-descriptions", key: "uri" },
  { id: "discovery", uri: "rest/discovery", key: "id", singleRequests: false, label: "Discovery" },// ALTERED
  { id: "extensions", uri: "rest/extensions", key: "id", label: "Extensions" },// ALTERED
  { id: "extension-repositories", uri: "rest/extension-repositories", key: "url", label: "Extension repositories" },// NEW
  { id: "manualextensions", uri: "rest/manualextensions", key: "id", label: "Manual extensions" }, // NEW
  { id: "scripts", uri: "rest/scripts", key: "filename", label: "Scripts" }, // NEW
  { id: "script-types", uri: "rest/script-types", key: "id" }, // NEW
  { id: "user-roles", uri: "rest/user-roles", key: "id", label: "User roles" }, // NEW
  { id: "icon-set", uri: "rest/icon-set", key: null }, // NEW
  { id: "about", uri: "rest/about", key: null }, // NEW
  { id: "virtual-thing-channels", uri: null, key: "uid", virtual: VirtualThingChannels }, // VIRTUAL
  { id: "user-interfaces", uri: "rest/user-interfaces", key: "id", label: "User interfaces" }, // NEW
  { id: "item-types", uri: "rest/item-types", key: "id" }, // NEW
  { id: "semantic-tags", uri: "rest/  semantic-tags", key: null }, // NEW
  { id: "bundle-status", uri: "rest/bundle-status", key: "id", label: "Bundle management" }, // NEW
  { id: "item-group-function-types", uri: "rest/item-group-function-types", key: "id" }, // NEW
  { id: "items", uri: "rest/items?metadata=.*", key: "name", onstart: true, label: "Items" },
  { id: "persistence-services", uri: "rest/persistence-services", key: "id" }, // NEW
  { id: "persistence", uri: "rest/persistence", key: "uid", singleRequests: false, label: "Persistence" }, // ALTERED
  { id: "inbox", uri: "rest/inbox", key: "thingUID", singleRequests: false, label: "Inbox" },
  { id: "links", uri: "rest/links", key: ["itemName", "channelUID"], singleRequests: false, label: "Item linking" },
  { id: "module-types", uri: "rest/module-types", key: "uid" },
  { id: "profile-types", uri: "rest/profile-types", key: "uid", singleRequests: false },
  { id: "rules", uri: "rest/rules", key: "uid", label: "Rules" },
  { id: "services", uri: "rest/services", key: "id", label: "Services" },
  { id: "service-config", uri: "rest/services", urlsuffix: "/config", wrapkey: "config", key: "id" },
  { id: "ruletemplates", uri: "rest/templates", key: "uid" },
  { id: "thing-types", uri: "rest/thing-types", key: "UID", onstart: true },
  { id: "thing-types-extended", uri: "rest/thing-types", key: "UID" }, // Extended variant for single requested data
  { id: "things", uri: "rest/things", key: "UID", onstart: true, label: "Things" },
  { id: "voice-interpreters", uri: "rest/voice", key: "id", label: "Voice interpreters" },
];

/**
 * The current DB version.
 * Whenever the data table layout or rewrite-data is changed, this need to be increased.
 * It will force the indexed db to be cleared out and rebuild.
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const dbversion = 52;

/** 
 * This is an associative map of storenames to store-layout descriptions.
 * @const
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const tableIDtoEntry = Object.freeze(tables.reduce((acc, t) => { acc[t.id] = t; return acc; }, {}));

export { tables, tableIDtoEntry, dbversion };