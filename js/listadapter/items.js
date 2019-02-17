import { store, openhabHost } from '../app.js';

class StoreView {
    constructor() {
        this.STORE_ITEM_INDEX_PROP = "name";
        this.runtimeKeys = ["link", "editable", "state"];
        this.items = [];
    }
    stores() { return { "items": "items" } };
    sortStore() { return "items" };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("items", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const ItemsMixin = {
    computed: {
        isGroup: function () {
            return this.item.type == "Group";
        },
        iconpath: function () {
            if (this.item.category) {
                return openhabHost() + "/icon/" + this.item.category;
            }
            return null;
        }
    },
}

const mixins = [ItemsMixin];
const listmixins = [];
export { mixins, listmixins, StoreView };
