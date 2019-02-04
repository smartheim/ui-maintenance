import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "module-types": "items" } };
    async getall() {
        return store.get("rest/module-types", "module-types").then(items => this.items = items);
    }
    dispose() {
    }
}


const ModulesMixin = {
    computed: {
        isTrigger: function () {
            return this.item.type == "trigger";
        },
        isCondition: function () {
            return this.item.type == "condition";
        },
        isAction: function () {
            return this.item.type == "action";
        },
    },
    methods: {
        dragstart: function (event) {
            event.dataTransfer.setData("oh/rulecomponent", event.target.dataset.uid);
            event.dataTransfer.dropEffect = "copy";
        }
    }
}

const mixins = [ModulesMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "UID";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
