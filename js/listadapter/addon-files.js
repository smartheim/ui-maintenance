import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "manualextensions": "items" } };
    async getall() {
        return store.get("rest/manualextensions", "manualextensions").then(items => this.items = items);
    }
    dispose() {
    }
}

const AddonsFileMixin = {
    methods: {
        getInstallDate: function () {
            return new Date(this.item.installed).toDateString();
        },
    }
}


const mixins = [AddonsFileMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
