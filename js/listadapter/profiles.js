// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/profile-types.json").then(response => response.json());
    }
    dispose() {
    }
}

const mixins = [];
const runtimekeys = [];
const schema = null;

export {mixins, schema, runtimekeys, StoreView};
