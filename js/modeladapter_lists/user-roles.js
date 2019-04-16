import { store, createNotification } from '../app.js';

/**
 * Virtual channel implementation for "thing-channels".
 * 
 * @param {StateWhileRevalidateStore} store The database store 
 * @param {Object} options The options
 * @param {Boolean} [options.force] If set and no cache data is found, http data is waited for and returned
 * @param {String} options.thingUID The thing UID
 * @param {String} objectid The object ID
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
async function VirtualThingChannels (store, options, objectid) {
  if (!options || !options.thingUID) throw new Error("No thingUID set!");
  const thing = await store.get("things", options.thingUID, options);
  const channels = thing.channels;
  channels.thing = thing; // Attach the original thing object to the array
  if (objectid) {
    return channels.find(i => i.uid == objectid);
  } else
    return channels;
}

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
  { id: "items", uri: "rest/items", urlsuffix: "?metadata=.*", key: "name", onstart: true, label: "Items" },
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
  { id: "things", uri: "rest/things", key: "UID", onstart: true, label: "Things" }, // ALTERED
  { id: "voice-interpreters", uri: "rest/voice", key: "id", label: "Voice interpreters" },
];

/** 
 * This is an associative map of storenames to store-layout descriptions.
 * @const
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const tableIDtoEntry = Object.freeze(tables.reduce((acc, t) => { acc[t.id] = t; return acc; }, {}));

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = []; this.itemlist = [];
  }
  stores() { return { "user-roles": "items" } };
  getall(options = null) {
    return store.get("items", null, { force: true })
      .then(json => this.itemlist = json)
      .then(() => this.get(null, null, options));
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("user-roles", null, options);
  }
  dispose() {
  }
}

const schema = {
  uri: 'http://openhab.org/schema/userrole-schema.json',
  fileMatch: ["http://openhab.org/schema/userrole-schema.json"],
  schema: {
    type: 'array',
    items: { "$ref": "#/definitions/item" },
    definitions: {
      item: {
        type: "object",
        description: "openHAB User Role",
        required: ["id", "label", "passwordhash"],
        properties: {
          id: { type: "string", description: "A unique ID for this user role", minLength: 2 },
          label: { type: "string", description: "A friendly name", minLength: 2 },
          annotation: { type: "string", description: "Your personal comment for this object" },
          description: { type: "string", description: "A user description" },
          password: { type: "string", description: "A password that will be converted to a password hash by openHAB" },
          passwordhash: { type: "string", description: "A password hash, generated by openHAB after a password has been transmitted" },
          tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
          items: { type: "array", "uniqueItems": true, description: "Items that this user role can access or nothing to not allow further specific items." },
          restEndpoints: { type: "array", description: "A list of allowed REST endpoint or nothing to allow access to everything" },
        }
      }
    }
  },
};

const ListMixin = {
  methods: {
    save: function () {
      this.message = null;
      this.messagetitle = "Saving...";
      this.inProgress = true;
      this.changed = false;
      setTimeout(() => this.inProgress = false, 1000);
    },
    remove: function () {
      if (this.item.id == "admin") {
        createNotification(null, `You are ... weird. You can't remove the administrator.`, false, 3000);
        return;
      }
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
    },
  }
};

const ItemListMixin = {
  mounted() {
    this.modelschema = Object.freeze(schema);
  },
  methods: {
    saveAll: function (items) {
      //TODO
      console.log("save all", items);
    },
  },
  computed: {
    restEndpoints() {
      return tables.filter(e => e.label);
    }
  }
};

const mixins = [ListMixin];
const listmixins = [ItemListMixin];

export { mixins, listmixins, ModelAdapter };
