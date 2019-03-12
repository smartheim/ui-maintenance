import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = []; this.items = []; this.itemlist = []; this.services = [];
  }
  stores() { return { "persistence": "items" } };
  getall(options = null) {
    return store.get("persistence-services", null, { force: true })
      .then(json => this.services = json)
      .then(() => store.get("items", null, options))
      .then(itemlist => this.itemlist = itemlist)
      .then(() => this.get(null, null, options));
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("persistence", null, options);
  }
  dispose() {
  }
  getService(serviceid) {
    for (const service of this.services) {
      if (service.id == serviceid)
        return service;
    }
  }
}

const schema = {
  uri: 'http://openhab.org/schema/rules-schema.json',
  fileMatch: ["http://openhab.org/schema/rules-schema.json"],
  schema: {
    type: 'array',
    items: { "$ref": "#/definitions/item" },
    definitions: {
      item: {
        type: "object",
        description: "openHAB Persistence",
        required: ["uid", "serviceid", "strategy", "label"],
        properties: {
          uid: { type: "string", description: "A unique ID for this thing", minLength: 2 },
          label: { type: "string", description: "A friendly name", minLength: 2 },
          annotation: { type: "string", description: "Your personal comment for this object" },
          serviceid: { type: "string", description: "The service ID" },
          tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
          items: { type: "array", "uniqueItems": true, description: "All items for this persistence" },
          strategy: {
            type: "array",
            description: "The persistence strategy. Each persistence service has different strategies available!",
            items: {
              type: "string"
            }
          }
        }
      }
    }
  },
}

const ListMixin = {
  methods: {
    getServices() {
      return this.$list.store.services;
    },
    getStrategies() {
      const service = this.$list.store.getService(this.item.serviceid);
      if (service) return service.strategies;
      return [];
    },
    persistenceService: function () {
      const service = this.$list.store.getService(this.item.serviceid);
      if (service) return service.label;
      return this.item.serviceid;
    },
    save: function () {
      this.message = null;
      this.messagetitle = "Saving...";
      this.inProgress = true;
      this.changed = false;
      setTimeout(() => this.inProgress = false, 1000);
    },
    remove: function () {
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
    },
  }
}

const ItemListMixin = {
  mounted() {
    this.modelschema = Object.freeze(schema);
  },
  methods: {
    saveAll: function (items) {
      //TODO
      console.log("save all", items);
    }
  }
};

const mixins = [ListMixin];
const listmixins = [ItemListMixin];
export { mixins, listmixins, ModelAdapter };
