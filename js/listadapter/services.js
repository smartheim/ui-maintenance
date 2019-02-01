import { store } from '../app.js';

class StoreView {
    mainStore() { return "services" };
    async getall() {
        return store.get("rest/config-descriptions", "config-descriptions")
            .then(json => this.configs = json)
            .then(() => store.get("rest/services", "services"))
            .then(list => this.list = list);
    }
    dispose() {
    }
    getConfigDesc(configDescriptionURI) {
        for (const config of this.configs) {
            if (config.uri == configDescriptionURI)
                return config;
        }
    }
}

const ServicesMixin = {
    methods: {
        configurations: function () {
            const type = this.$root.store.getConfigDesc(this.item.configDescriptionURI);
            if (type) return type.parameters;
            return [];
        },
        convertOptions: function (optionArray) {
            var d = {};
            for (let entry of optionArray) {
                d[entry.value] = entry.label;
            }
            return d;
        },
        mapChanged: function (event) {
            document.getElementById('mapcoordinates').value = event.target.value[0] + "," + event.target.value[1];
        }
    }
}

const mixins = [ServicesMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
