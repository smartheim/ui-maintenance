import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "scripts": "items" } };
    async getall() {
        return store.get("rest/scripts", "scripts").then(items => this.items = items);
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
