import { store } from '../app.js';

class StoreView {
    constructor() { this.STORE_ITEM_INDEX_PROP = "id"; this.runtimeKeys = []; this.value = {}; }
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
export { mixins, StoreView };
