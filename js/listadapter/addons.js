import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "extensions": "items" } };
    async getall() {
        return store.get("rest/extensions", "extensions").then(items => this.items = items);
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
        }
    }
}

const mixins = [AddonsMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
