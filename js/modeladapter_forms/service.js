import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.value = {}; this.configDescription = null; this.config = {};
  }
  stores() { return { "services": "value" } };
  async get(table = null, objectid = null, options = null) {
    try {
      const value = await store.get("services", objectid, options);
      if (value && value.configDescriptionURI)
        await this.getConfig(objectid, value.configDescriptionURI);
      this.value = value;
      return this.value;
    } catch (e) {
      this.value = null;
      return null;
    }
  }
  async getConfig(serviceid, configDescriptionURI) {
    this.configDescription = await store.get("config-descriptions", configDescriptionURI, { force: true }).catch(e => { });
    this.config = await store.get("service-config", serviceid, { force: true }).catch(e => { });
  }
  dispose() {
  }
}

const ServiceMixin = {
  mounted: function () {
  },
  computed: {
    statusinfo: function () {
      return this.value.status ? this.value.status.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown";
    },
    statusDetails: function () {
      return this.value.status && this.value.status.statusDetail != "NONE" ? this.value.status.statusDetail : "";
    },
    statusmessage: function () {
      return this.value.status ? this.value.status.message : "";
    },
    statusBadge: function () {
      const status = this.value.status ? this.value.status.status : "";
      switch (status) {
        case "ONLINE": return "badge badge-success";
        case "OFFLINE": return "badge badge-danger";
        case "UNINITIALIZED": return "badge badge-info";
      }
      return "badge badge-light";
    },
    configuration() {
      return this.configDescription;
    }
  },
  methods: {
    action(actionid) {
      console.log("actionID", actionid);
    },
    getConfigValue(param) {
      return this.config[param.name];
    },
    setConfigValue() {
      console.log("CONFIG", arguments);
      //Vue.set(config, arguments[0], arguments[1])
    }
  }
}

const mixins = [ServiceMixin];
export { mixins, ModelAdapter };
