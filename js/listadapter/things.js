import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; this.thingtypes = []; }
    stores() { return { "things": "items" } };
    sortStore() { return "things" };
    getall(options = null) {
        return store.get("thing-types", null, { force: true })
            .then(list => this.thingtypes = list)
            .then(() => this.get(options))
    }
    get(options = null) {
        return store.get("things", null, options).then(items => this.items = items);
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
        commontags: function () {
            return [];
        },
        statusinfo: function () {
            return this.item.statusInfo ? this.item.statusInfo.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown";
        },
        statusDetails: function () {
            return this.item.statusInfo ? this.item.statusInfo.statusDetail : "";
        },
        statusmessage: function () {
            return this.item.statusInfo ? this.item.statusInfo.message : "";
        },
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
            const thingType = this.$root.store.getThingTypeFor(this.item.thingTypeUID);
            if (thingType) return thingType.description;
            return "No Thing description available";
        },
        triggerAction(actionEvent) {
            console.log("triggered", actionEvent.target.dataset.uid, actionEvent.detail);
            this.message = null;
            this.messagetitle = "Performing action...";
            this.inProgress = true;
            this.changed = false;
            setTimeout(() => {
                this.inProgress = false;
            }, 500);
        },
        haschannels() {
            return this.item.channels.length > 0;
        },
        save: function () {
            this.message = null;
            this.messagetitle = "Saving...";
            this.inProgress = true;
            this.changed = false;
            setTimeout(() => this.inProgress = false, 1000);
        },
        remove: function () {
            this.message = null;
            this.messagetitle = "Removing...";
            this.inProgress = true;
        },
    }
}

const mixins = [ThingsMixin];
const listmixins = [];
const runtimekeys = ["link", "editable", "statusInfo", "properties", "actions"];
const ID_KEY = "UID";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
