import { store } from '../app.js';

class StoreView {
    mainStore() { return "services" };
    async get(serviceid) {
        return store.get("rest/services/" + serviceid, "services", serviceid)
            .then(v => this.value = v)
            .then(() => this.value.configDescriptionURI ?
                store.get("rest/config-descriptions", "config-descriptions", this.value.configDescriptionURI, "uri") : null)
            .then(v => this.config = v)
            .then(() => this.value);
    }
    dispose() {
    }
    getConfig() {
        return this.config;
    }
}

const ServiceMixin = {
    mounted: function () {
    },
    methods: {
        configuration: function () {
            return this.$root.store.getConfig();
        }
    }
}

const mixins = [ServiceMixin];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
