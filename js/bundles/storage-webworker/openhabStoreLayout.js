
/**
 * The following table describes all available stores for the model (database). Most
 * of the stores correspond to a REST endpoint. If a rest endpoint does not allow
 * indiviual object requests, it is annotated with "singleRequests: false".
 * 
 * Some stores are pre-loaded on application start, annotated with "onstart: true".
 */
const tables = [
    { id: "bindings", uri: "rest/bindings", key: "id", singleRequests: false, onstart: true },// ALTERED
    { id: "binding-config", uri: "rest/bindings", urlsuffix: "/config", wrapkey: "config", key: "id" },
    { id: "channel-types", uri: "rest/channel-types", key: "UID", onstart: true },
    { id: "config-descriptions", uri: "rest/config-descriptions", key: "uri" },
    { id: "discovery", uri: "rest/discovery", key: "id", singleRequests: false },// ALTERED
    { id: "extensions", uri: "rest/extensions", key: "id" },// ALTERED
    { id: "extension-repositories", uri: "rest/extension-repositories", key: "id" },// NEW
    { id: "manualextensions", uri: "rest/manualextensions", key: "id" }, // NEW
    { id: "scripts", uri: "rest/scripts", key: "filename" }, // NEW
    { id: "script-types", uri: "rest/script-types", key: "id" }, // NEW
    { id: "schedule", uri: "rest/schedule", key: "UID" }, // NEW
    { id: "inbox", uri: "rest/inbox", key: "thingUID", singleRequests: false },
    { id: "items", uri: "rest/items?metadata=.*", key: "name", onstart: true },
    { id: "links", uri: "rest/links", key: ["itemName", "channelUID"], singleRequests: false },
    { id: "module-types", uri: "rest/module-types", key: "uid" },
    { id: "item-types", uri: "rest/item-types", key: "id" }, // NEW
    { id: "item-group-function-types", uri: "rest/item-group-function-types", key: "id" }, // NEW
    { id: "persistence", uri: "rest/persistence", key: "uid", singleRequests: false }, // ALTERED
    { id: "persistence-services", uri: "rest/persistence-services", key: "id" }, // NEW
    { id: "profile-types", uri: "rest/profile-types", key: "uid", singleRequests: false },
    { id: "rules", uri: "rest/rules", key: "uid" },
    { id: "services", uri: "rest/services", key: "id" },
    { id: "service-config", uri: "rest/services", urlsuffix: "/config", wrapkey: "config", key: "id" },
    { id: "ruletemplates", uri: "rest/templates", key: "uid" },
    { id: "thing-types", uri: "rest/thing-types", key: "UID", onstart: true },
    { id: "things", uri: "rest/things", key: "UID", onstart: true },
    { id: "voice-interpreters", uri: "rest/voice", key: "id" },
];
const dbversion = 20;

/** 
 * This is an associative map of storenames to store-layout descriptions.
 * @const
 */
var tableIDtoEntry = {};
for (let t of tables) tableIDtoEntry[t.id] = t;

export { tables, tableIDtoEntry, dbversion };