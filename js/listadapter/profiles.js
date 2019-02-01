import { store } from '../app.js';

class StoreView {
    mainStore() { return "profile-types" };
    async getall() {
        return store.get("rest/profile-types", "profile-types").then(list => this.list = list);
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
