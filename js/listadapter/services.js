import { store } from '../app.js';

class StoreView {
    mainStore() { return "services" };
    async getall() {
        return store.get("rest/services", "services")
            .then(list => this.list = list);
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
