import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "extensions": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("extensions", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const AddonsMixin = {
    methods: {
        install: function () {
            this.message = null;
            this.messagetitle = "Installing...";
            this.inProgress = true;
        },
        changeVersion: function () {
            this.message = null;
            this.messagetitle = "Changing version";
            this.inProgress = true;
        },
        remove: function () {
            this.message = null;
            this.messagetitle = "Removing...";
            this.inProgress = true;
        },
    }
}

const mixins = [AddonsMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
