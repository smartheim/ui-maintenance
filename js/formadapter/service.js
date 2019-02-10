import { store } from '../app.js';

class StoreView {
    constructor() { this.value = {}; }
    stores() { return { "services": "value" } };
    get(serviceid, options = null) {
        return store.get("services", serviceid, options)
            .then(v => this.value = v)
            .then(() => this.value.configDescriptionURI ?
                store.get("config-descriptions", this.value.configDescriptionURI, { force: true }) : null)
            .then(v => this.config = v);
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
