import { store } from '../app.js';

class StoreView {
    constructor() { this.value = {}; }
    stores() { return { "bindings": "value" } };
    get(bindingid, options = null) {
        return store.get("bindings", bindingid, options)
            .then(v => this.value = v)
            .then(() => this.value.configDescriptionURI ?
                store.get(this.value.configDescriptionURI) : null)
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
const ID_KEY = "id";

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
