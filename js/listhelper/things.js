// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/thing-types.json")
            .then(response => response.json())
            .then(json => this.thingtypes = json)
            .then(() => fetchWithTimeout("dummydata/rest/things.json"))
            .then(response => response.json());
    }
    getThingTypeFor(uid) {
        for (const thingType of this.thingtypes) {
            if (thingType.UID == uid)
                return thingType;
        }
        return null;
    }
    dispose() {
    }
}

const schema = {
    uri: 'http://openhab.org/schema/things-schema.json',
    fileMatch: ["http://openhab.org/schema/things-schema.json"],
    schema: {
        type: 'array',
        items: { "$ref": "#/definitions/item" },
        definitions: {
            item: {
                type: "object",
                description: "An openHAB thing",
                required: ["UID", "thingTypeUID", "label"],
                properties: {
                    link: { type: "string", description: "Internal URI information for openHAB REST clients" },
                    editable: { type: "boolean", description: "Items defined via old .item files are not editable" },
                    UID: { type: "string", description: "A unique ID for this thing", minLength: 2 },
                    label: { type: "string", description: "A friendly name", minLength: 2 },
                    tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
                    // config: { // reference the second schema.. demo
                    //     $ref: 'http://myserver/bar-schema.json', 
                    // },
                }
            }
        }
    },
}

const ThingsMixin = {
    methods: {
        statusinfo: function () {
            return this.item.statusInfo ? this.item.statusInfo.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown";
        },
        statusDetails: function () {
            return this.item.statusInfo ? this.item.statusInfo.statusDetail : "";
        },
        statusmessage: function () {
            return this.item.statusInfo ? this.item.statusInfo.message : "";
        }, //TODO
        statusBadge: function () {
            const status = this.item.statusInfo ? this.item.statusInfo.status : "";
            switch (status) {
                case "ONLINE": return "badge badge-success";
                case "OFFLINE": return "badge badge-danger";
                case "UNINITIALIZED": return "badge badge-info";
            }
            return "badge badge-light";
        },
        description() {
            const thingType = this.$parent.store.getThingTypeFor(this.UID);
            if (thingType) return thingType.description;
            return "No Thing description available";
        },
        getActions() {
            return {
                "Disable": "Disable this thing",
                "Start pairing": "This thing requires a special pairing method",
                "Unpair": "Removes the association to the remote device",
            }
        },
        triggerAction(actionEvent) {
            console.log("triggered", actionEvent.target.dataset.uid, actionEvent.detail);
        }
    }
}

const mixins = [ThingsMixin];

const runtimekeys = ["link", "editable", "statusInfo", "properties"];

export { mixins, schema, runtimekeys, StoreView };
