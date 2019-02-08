import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "ruletemplates": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("ruletemplates", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "uid";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
