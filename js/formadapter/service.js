import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.value = {};
  }
  stores() { return { "services": "value" } };
  async get(serviceid, options = null) {
    this.value = await store.get("services", serviceid, options);
    if (this.value && this.value.configDescriptionURI)
      await this.getConfig(serviceid, this.value.configDescriptionURI);
    return this.value;
  }
  async getConfig(serviceid, configDescriptionURI) {
    this.configDescription = await store.get("config-descriptions", configDescriptionURI, { force: true });
    if (!this.configDescription) return;
    this.config = await store.get("service-config", serviceid, { force: true });
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
  },
  methods: {
    configuration: function () {
      return this.$root.store.getConfig();
    },
    action(actionid) {
      console.log("actionID", actionid);
    }
  }
}

const mixins = [ServiceMixin];
export { mixins, ModelAdapter };
