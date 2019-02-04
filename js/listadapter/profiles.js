import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "profile-types": "list" } };
    async getall() {
        return store.get("rest/profile-types", "profile-types").then(items => this.items = items);
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
