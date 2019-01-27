// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/thing-types.json")
            .then(response => response.json())
            .then(json => this.thingtypes = json)
            .then(() => fetchWithTimeout("dummydata/rest/bindings.json"))
            .then(response => response.json())
            .then(json => this.bindings = json)
            .then(() => fetchWithTimeout("dummydata/rest/inbox.json"))
            .then(response => response.json())
            .then(json => this.thing = json);
    }
    getThingTypeFor(uid) {
        for (const type of this.thingtypes) {
            if (type.UID == uid)
                return type;
        }
        return null;
    }
    getBindingFor(bindingid) {
        for (const binding of this.bindings) {
            if (binding.id == bindingid)
            return binding;
        }
    }
    dispose() {
    }
}

const InboxMixin = {
    methods: {
        binding() {
            const bindingid = this.item.thingTypeUID.split(":")[0];
            const bindings = this.$root.store.getBindingFor(bindingid);
            if (bindings) return bindings.name;
            return "Binding not found";
        },
        description() {
            const type = this.$root.store.getThingTypeFor(this.item.thingTypeUID);
            if (type) return type.description;
            return "No Thing description available";
        },
        hide() {
            console.log("hide");
            this.inProgress = true;
        },
        accept() {
            console.log("accept");
            this.inProgress = true;
        }
    }
}

const mixins = [InboxMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView };
