// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/extensions.json").then(response => response.json());
    }
    dispose() {
    }
}

const AddonsMixin = {
    methods: {
        install: function() {
            console.log("install");
            this.inProgress = true;
        },
        changeVersion: function() {
            console.log("changeversion");
            this.inProgress = true;
        }
    }
}

const mixins = [AddonsMixin];
const runtimekeys = [];
const schema = null;

export {mixins, schema, runtimekeys, StoreView};
