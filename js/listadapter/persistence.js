import { store } from '../app.js';

class StoreView {
    mainStore() { return "persistence" };
    async getall() {
        return store.get("rest/persistence-services", "persistence-services")
            .then(json => this.services = json)
            .then(() => store.get("rest/persistence", "persistence"))
            .then(list => this.list = list);
    }
    dispose() {
    }
    getService(serviceid) {
        for (const service of this.services) {
            if (service.id == serviceid)
                return service;
        }
    }
}


const ServicesMixin = {
    methods: {
        persistenceService: function () {
            const service = this.$root.store.getService(this.item.serviceid);
            if (service) return service.label;
            return this.item.serviceid;
        },
    }
}

const mixins = [ServicesMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "uid";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
