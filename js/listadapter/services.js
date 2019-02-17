import { store } from '../app.js';

class StoreView {
    constructor() { this.STORE_ITEM_INDEX_PROP = "id"; this.runtimeKeys = []; this.items = []; }
    stores() { return { "services": "items" } };
    sortStore() { return "services" };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("services", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const ServicesMixin = {
    methods: {
        mapChanged: function (event) {
            document.getElementById('mapcoordinates').value = event.target.value[0] + "," + event.target.value[1];
        }
    }
}

const mixins = [ServicesMixin];
const listmixins = [];

export { mixins, listmixins, StoreView };
