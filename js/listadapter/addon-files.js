import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "manualextensions": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("manualextensions", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const AddonsFileMixin = {
    methods: {
        getInstallDate: function () {
            return new Date(this.item.installed).toDateString();
        },
        remove: function () {
            this.message = null;
            this.messagetitle = "Removing...";
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
