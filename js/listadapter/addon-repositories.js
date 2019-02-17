import { store } from '../app.js';

class StoreView {
    constructor() { this.STORE_ITEM_INDEX_PROP = "id"; this.runtimeKeys = []; this.items = []; }
    stores() { return { "extension-repositories": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("extension-repositories", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const AddonsFileMixin = {
    methods: {
        enable: function () {
            this.message = null;
            this.messagetitle = "Enable...";
            this.inProgress = true;
        },
        disable: function () {
            this.message = null;
            this.messagetitle = "Disable...";
            this.inProgress = true;
        },
    }
}


const mixins = [AddonsFileMixin];
const listmixins = [];

export { mixins, listmixins, StoreView };
