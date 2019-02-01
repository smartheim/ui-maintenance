import { store } from '../app.js';

class StoreView {
    mainStore() { return "manualextensions" };
    async getall() {
        return store.get("rest/manualextensions", "manualextensions").then(list => this.list = list);
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
