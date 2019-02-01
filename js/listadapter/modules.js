import { store } from '../app.js';

class StoreView {
    mainStore() { return "module-types" };
    async getall() {
        return store.get("rest/module-types", "module-types").then(list => this.list = list);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "UID";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
