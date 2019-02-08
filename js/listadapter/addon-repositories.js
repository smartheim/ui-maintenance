import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
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
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
