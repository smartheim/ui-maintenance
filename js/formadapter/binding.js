import { store } from '../app.js';

const ID_KEY = "id";

class StoreView {
    mainStore() { return "bindings" };
    async get(bindingid) {
        return store.get("rest/bindings", "bindings", bindingid, ID_KEY).then(v => this.value = v);
    }
    dispose() {
    }
}

const BindingsMixin = {
    mounted: function () {
    },
    methods: {
        configurations: function () {
            return this.objectdata.configurations ? this.objectdata.configurations : [];
        }
    }
}

const mixins = [BindingsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
