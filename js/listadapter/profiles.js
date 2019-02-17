import { store } from '../app.js';

class StoreView {
    constructor() { this.STORE_ITEM_INDEX_PROP = "UID"; this.runtimeKeys = []; this.items = []; }
    stores() { return { "profile-types": "list" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("profile-types", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, StoreView };
