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
            this.original.status = "unknown";
        },
        changeVersion: function() {
            this.original.status = "unknown";
        }
    },
    computed: {
        inProgress: function() {
            return (this.item.status!="installed" && this.item.status!="notinstalled");
        }
    }
}

const mixins = [AddonsMixin];
const runtimekeys = [];
const schema = null;

export {mixins, schema, runtimekeys, StoreView};
