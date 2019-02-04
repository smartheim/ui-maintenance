
const tables = [
    { id: "bindings", key: "id" },// ALTERED
    { id: "binding-config", key: "id" },
    { id: "channel-types", key: "UID" },
    { id: "config-descriptions", key: "uri" },
    { id: "discovery", key: "id" },// ALTERED
    { id: "extensions", key: "id" },// ALTERED
    { id: "manualextensions", key: "id" }, // NEW
    { id: "scripts", key: "filename" }, // NEW
    { id: "script-types", key: "id" }, // NEW
    { id: "schedule", key: "UID" }, // NEW
    { id: "inbox", key: "thingUID" },
    { id: "items", key: "name" },
    { id: "links", key: ["itemName", "channelUID"] },
    { id: "module-types", key: "uid" },
    { id: "persistence", key: "uid" }, // ALTERED
    { id: "persistence-services", key: "id" }, // NEW
    { id: "profile-types", key: "uid" },
    { id: "rules", key: "uid" },
    { id: "services", key: "id" },
    { id: "service-config", key: "id" },
    { id: "templates", key: "uid" },
    { id: "thing-types", key: "UID" },
    { id: "things", key: "UID" },
    { id: "voice-interpreters", key: "id" },
];
const dbversion = 12;
var tableToId = {};
for (let t of tables) if (!Array.isArray(t.key)) tableToId[t.id] = t.key;
export { tables, tableToId, dbversion };