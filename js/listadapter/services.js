import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "services": "items" } };
    async getall() {
        return store.get("rest/services", "services")
            .then(items => this.items = items);
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
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
