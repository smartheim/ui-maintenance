import { store } from '../app.js';

class StoreView {
    mainStore() { return "services" };
    async get(serviceid) {
        return store.get("rest/services/" + serviceid, "services", serviceid).then(v => this.value = v);
    }
    dispose() {
    }
}

const ServiceMixin = {
    mounted: function () {
    },
    methods: {
        configurations: function () {
            return this.objectdata.configurations ? this.objectdata.configurations : [];
        }
    }
}

const mixins = [ServiceMixin];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
