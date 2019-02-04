import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "inbox": "items" } };
    async getall() {
        return store.get("rest/thing-types", "thing-types")
            .then(json => this.thingtypes = json)
            .then(() => store.get("rest/bindings", "bindings"))
            .then(json => this.bindings = json)
            .then(() => store.get("rest/inbox", "inbox"))
            .then(list => this.list = list);
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
            this.message = null;
            this.messagetitle = "Hiding...";
            this.inProgress = true;
        },
        accept() {
            this.message = null;
            this.messagetitle = "Accepting...";
            this.inProgress = true;
        }
    }
}

const InboxListMixin = {
    methods: {
        clear() {
            console.log("clear");
        },
    }
}

const mixins = [InboxMixin];
const listmixins = [InboxListMixin];
const runtimekeys = [];
const schema = null;
const ID_KEY = "thinkUID";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
