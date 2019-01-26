// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/manualextensions.json").then(response => response.json());
    }
    dispose() {
    }
}

const AddonsFileMixin = {
    methods: {
        getInstallDate: function() {
            return new Date(this.item.installed).toDateString();
        },
    }
}


const mixins = [AddonsFileMixin];
const runtimekeys = [];
const schema = null;

export {mixins, schema, runtimekeys, StoreView};
