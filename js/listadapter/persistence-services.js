import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "persistence-services": "items" } };
    async getall() {
        return store.get("rest/persistence-services", "persistence-services").then(items => this.items = items);
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
