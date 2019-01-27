// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async get(bindingid) {
        return fetchWithTimeout("dummydata/rest/bindings.json")
            .then(response => response.json())
            .then(json => json.find(e => e.id == bindingid));
    }
    dispose() {
    }
}

const BindingsMixin = {
    mounted: function () {
    },
    methods: {
        configurations: function () {
            return this.objectdata.configurations ? this.objectdata.configurations : [];
        }
    }
}

const ID_KEY = "id";
const mixins = [BindingsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };
