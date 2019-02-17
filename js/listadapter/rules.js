import { store, fetchMethodWithTimeout, createNotification } from '../app.js';

class StoreView {
    constructor() {
        this.STORE_ITEM_INDEX_PROP = "uid";
        this.runtimeKeys = ["link", "editable", "state", "runcounter"];
        this.items = [];
    }
    stores() { return { "rules": "items" } };
    getall(options = null) {
        return this.get(options);
    }
    get(options = null) {
        return store.get("rules", null, options).then(items => this.items = items);
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
                description: "openHAB Rule",
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
    computed: {
        image() {
            return "./img/scene_dummy.jpg";
        }
    },
    methods: {
        commontags: function () {
            return [];
        },
        rulesStatusinfo: function () { return this.item.status ? this.item.status.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown"; },
        rulesStatusDetails: function () { return this.item.status ? this.item.status.statusDetail : ""; },
        rulesStatusmessage: function () { return this.item.status ? this.item.status.description : ""; }, //TODO
        rulesStatusBadge: function () {
            const status = this.item.status ? this.item.status.status : "";
            switch (status) {
                case "RUNNING": return "badge badge-success";
                case "UNINITIALIZED": return "badge badge-danger";
                case "IDLE": return "badge badge-secondary";
            }
            return "badge badge-light";
        },
        run: function (target) {
            if (target.classList.contains("disabled")) return;
            target.classList.add("disabled");
            fetchMethodWithTimeout(store.host + "/rest/rules/" + this.item.uid + "/runnow", "POST", "", null)
                .then(r => {
                    createNotification(null, `Run ${this.item.name}`, false, 1500);
                    setTimeout(() => target.classList.remove("disabled"), 1000);
                }).catch(e => {
                    setTimeout(() => target.classList.remove("disabled"), 1000);
                    createNotification(null, `Failed ${this.item.name}: ${e}`, false, 4000);
                })
        },
        remove: function () {
            this.message = null;
            this.messagetitle = "Removing...";
            this.inProgress = true;
            fetchMethodWithTimeout(store.host + "/rest/rules/" + this.item.uid, "DELETE", null)
                .then(r => {
                    this.message = "Rule '" + this.item.name + "' removed";
                }).catch(e => {
                    this.message = e.toString();
                })
        },
    }
}

const ItemListMixin = {
    mounted() {
        this.modelschema = Object.freeze(schema);
    },
    methods: {
        async saveAll(updated, created, removed) {
            let errorItems = [];
            for (let item of updated) {
                await fetchMethodWithTimeout(store.host + "/rest/rules/" + item.uid, "PUT", JSON.stringify(item))
                    .catch(e => {
                        errorItems.push(item.name + ":" + e.toString());
                    })
            }
            for (let item of created) {
                await fetchMethodWithTimeout(store.host + "/rest/rules", "POST", JSON.stringify(item))
                    .catch(e => {
                        errorItems.push(item.name + ":" + e.toString());
                    })
            }
            for (let item of removed) {
                await fetchMethodWithTimeout(store.host + "/rest/rules/" + item.uid, "DELETE")
                    .catch(e => {
                        errorItems.push(item.name + ":" + e.toString());
                    })
            }
            if (errorItems.length) {
                throw new MultiRestError("Some objects failed", errorItems);
            } else {
                createNotification(null, `Updated ${updated.length}, Created ${created.length}, Removed ${removed.length} objects`, false, 1500);
            }
        },
    }
};

const mixins = [RulesMixin];
const listmixins = [ItemListMixin];
export { mixins, listmixins, StoreView };
