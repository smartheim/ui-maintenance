import { store } from '../app.js';

class StoreView {
    constructor() { this.STORE_ITEM_INDEX_PROP = null; this.runtimeKeys = []; this.items = []; }
    stores() { return { "item-types": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("item-types", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, StoreView };
