import { store } from '../app.js';

class StoreView {
    mainStore() { return "persistence-services" };
    async getall() {
        return store.get("rest/persistence-services", "persistence-services").then(list => this.list = list);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
