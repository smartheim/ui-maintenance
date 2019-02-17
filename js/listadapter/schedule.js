// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import * as cronstrue from '../cronstrue.js';
import { store } from '../app.js';

class StoreView {
    constructor() {
        this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
        this.runtimeKeys = Object.freeze(["link", "editable", "remainingRuns", "totalRuns", "lastrun"]);
        this.items = [];
    }
    stores() { return { "schedule": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("schedule", null, options).then(items => this.items = items);
    }
    dispose() {
    }
}

const schema = {
    uri: 'http://openhab.org/schema/timer-schema.json',
    fileMatch: ["http://openhab.org/schema/timer-schema.json"],
    schema: {
        type: 'array',
        items: { "$ref": "#/definitions/item" },
        definitions: {
            item: {
                type: "object",
                description: "An openHAB thing",
                required: ["UID", "type", "label"],
                properties: {
                    link: { type: "string", description: "Internal URI information for openHAB REST clients" },
                    editable: { type: "boolean", description: "Items defined via old .item files are not editable" },
                    UID: { type: "string", description: "A unique ID for this thing", minLength: 2 },
                    label: { type: "string", description: "A friendly name", minLength: 2 },
                    tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
                    type: {
                        enum: ['fixed', 'cron'],
                        description: "A fixed timer runs once at the given date and time. A cron timer is reoccuring."
                    },
                    cronExpression: { type: "string", description: "A cron expression for reoccuring events", minLength: 2 },
                    datetime: { type: "string", description: "A date/time expressed as ISO 8601 Notation", minLength: 2 }
                    // config: { // reference the second schema.. demo
                    //     $ref: 'http://myserver/bar-schema.json', 
                    // },
                }
            }
        }
    },
}

const ScheduleMixin = {
    methods: {
        commontags: function () {
            return [];
        },
        timerStatusinfo: function () {
            return (this.item.lastrun + 5000) > Date.now() ? "Running" : "Idle";
        },
        timerStatusBadge: function () {
            return (this.item.lastrun + 5000) > Date.now() ? "badge badge-success" : "badge badge-secondary";
        },
        timerDescription: function () {
            if (this.item.type == "cron") {
                try {
                    return cronstrue.toString(this.item.cronExpression, { throwExceptionOnParseError: true, use24HourTimeFormat: true });
                } catch (e) {
                    return "Cron expression parse error: " + e;
                }
            } else if (this.item.type == "fixed") {
                return new Date().toString();
            } else {
                return "Unsupported timer type";
            }
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

const ItemListMixin = {
    mounted() {
        this.modelschema = Object.freeze(schema);
    },
    methods: {
        saveAll: function (items) {
            //TODO
            console.log("save all", items);
        }
    }
};

const mixins = [ScheduleMixin];
const listmixins = [ItemListMixin];
export { mixins, listmixins, StoreView };
