// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/config-descriptions.json")
            .then(response => response.json())
            .then(json => this.configs = json)
            .then(() => fetchWithTimeout("dummydata/rest/services.json"))
            .then(response => response.json())
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
        mapChanged: function(event) {
            document.getElementById('mapcoordinates').value=event.target.value[0]+","+event.target.value[1];
        }
    }
}

const mixins = [ServicesMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView };
