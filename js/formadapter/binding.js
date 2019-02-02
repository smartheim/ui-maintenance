import { store } from '../app.js';

const ID_KEY = "id";

class StoreView {
    mainStore() { return "bindings" };
    async get(bindingid) {
        return store.get("rest/bindings", "bindings", bindingid, ID_KEY)
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

const BindingsMixin = {
    mounted: function () {
    },
    methods: {
        configuration: function () {
            return this.$root.store.getConfig();
        }
    }
}

const mixins = [BindingsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
