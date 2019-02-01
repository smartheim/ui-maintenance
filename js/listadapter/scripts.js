import { store } from '../app.js';

class StoreView {
    mainStore() { return "scripts" };
    async getall() {
        return store.get("rest/scripts", "scripts").then(list => this.list = list);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "filename";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
