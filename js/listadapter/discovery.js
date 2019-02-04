import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; this.bindings = []; }
    stores() { return { "discovery": "items" } };
    async getall() {
        return store.get("rest/bindings", "bindings")
            .then(json => this.bindings = json)
            .then(() => store.get("rest/discovery", "discovery"))
            .then(items => this.items = items);
    }
    dispose() {
    }
    //TODO make this a map lookup instead of linear search
    getBindingFor(bindingid) {
        for (const binding of this.bindings) {
            if (binding.id == bindingid)
                return binding;
        }
    }
}

const DiscoveryMixin = {
    data: function () {
        return {
            activediscovery: false
        }
    },
    methods: {
        description() {
            const bindings = this.$root.store.getBindingFor(this.item.id);
            if (bindings) return bindings.description;
            return "Binding not found";
        },
        label() {
            const bindings = this.$root.store.getBindingFor(this.item.id);
            if (bindings) return bindings.name;
            return "Binding not found";
        },
        toggle() {
            if (this.timer) clearTimeout(this.timer);
            this.timer = null;

            this.activediscovery = !this.activediscovery;
            if (this.activediscovery) {
                this.timer = setTimeout(() => {
                    this.timer = null;
                    this.activediscovery = false;
                }, 3000);
            }
            console.log("toggle discovery");
        },
    }
}

const mixins = [DiscoveryMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
