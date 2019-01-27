// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/rules.json").then(response => response.json());
    }
    dispose() {
    }
}

const schema = {
    uri: 'http://openhab.org/schema/rules-schema.json',
    fileMatch: ["http://openhab.org/schema/rules-schema.json"],
    schema: {
        type: 'array',
        items: { "$ref": "#/definitions/item" },
        definitions: {
            item: {
                type: "object",
                description: "An openHAB thing",
                required: ["uid", "name"],
                properties: {
                    link: { type: "string", description: "Internal URI information for openHAB REST clients" },
                    editable: { type: "boolean", description: "Items defined via old .item files are not editable" },
                    uid: { type: "string", description: "A unique ID for this thing", minLength: 2 },
                    name: { type: "string", description: "A friendly name", minLength: 2 },
                    tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
                    // config: { // reference the second schema.. demo
                    //     $ref: 'http://myserver/bar-schema.json', 
                    // },
                }
            }
        }
    },
}

const RulesMixin = {
    methods: {
        rulesStatusinfo: function () { return this.item.status ? this.item.status.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown"; },
        rulesStatusDetails: function () { return this.item.status ? this.item.status.statusDetail : ""; },
        rulesStatusmessage: function () { return this.item.status ? this.item.status.description : ""; }, //TODO
        rulesStatusBadge: function () {
            const status = this.item.status ? this.item.status.status : "";
            switch (status) {
                case "RUNNING": return "badge badge-success";
                case "UNINITIALIZED": return "badge badge-danger";
                case "IDLE": return "badge badge-info";
            }
            return "badge badge-light";
        },
    }
}

const mixins = [RulesMixin];
const runtimekeys = ["link","editable","status","runcounter"];

export {mixins, schema, runtimekeys, StoreView};
