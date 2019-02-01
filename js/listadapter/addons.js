import { store } from '../app.js';

class StoreView {
    mainStore() { return "extensions" };
    async getall() {
        return store.get("rest/extensions", "extensions").then(list => this.list = list);
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
