import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "thing-types": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("thing-types", null, options).then(items => this.items = items);
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
