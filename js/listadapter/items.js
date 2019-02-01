import { store, fetchMethodWithTimeout } from '../app.js';

class StoreView {
    mainStore() { return "items" };
    async getall() {
        return store.get("rest/items", "items").then(list => this.list = list);
    }
    dispose() {
    }
}

const schema = {
    uri: 'http://openhab.org/schema/items-schema.json', // id of the item schema
    fileMatch: ["http://openhab.org/schema/items-schema.json"], // associate with our model
    schema: {
        type: 'array',
        items: { "$ref": "#/definitions/item" },
        definitions: {
            item: {
                type: "object",
                description: "An openHAB item",
                required: ["type", "name", "label"],
                properties: {
                    link: { type: "string", description: "Internal URI information for openHAB REST clients" },
                    type: {
                        enum: ['String', 'Number', 'Switch', 'Color', 'Contact', 'DateTime', 'Dimmer', 'Image', 'Location', 'Player',
                            'Rollershutter'],
                        description: "The item type"
                    },
                    category: { type: "string", description: "The item category. Some are predefined, but you can have your own as well" },
                    editable: { type: "boolean", description: "Items defined via old .item files are not editable" },
                    state: {
                        type: ["integer", "string", "boolean"],
                        description: "The current state of the item",
                    },
                    stateDescription: {
                        type: "object",
                        description: "The state can be limited to a number of options and formatted",
                        required: ["pattern", "readOnly", "options"],
                        properties: {
                            pattern: { type: "string", description: "A formatter pattern" },
                            readOnly: { type: "boolean", description: "Is this state read-only?" },
                            options: { type: "array", description: "Options" },
                        }
                    },
                    name: { type: "string", description: "A unique ID for this item", minLength: 2 },
                    label: { type: "string", description: "A friendly name", minLength: 2 },
                    tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
                    groupNames: { type: "array", "uniqueItems": true, description: "Assign this item to groups" },
                    // config: { // reference the second schema.. demo
                    //     $ref: 'http://myserver/bar-schema.json', 
                    // },
                }
            }
        }
    },
}

const ItemsMixin = {
    computed: {
        itemtype: function () {
            if (this.item.type == "Group") return (this.item.basetype ? this.item.basetype : "String");
            return this.item.type;
        },
        isGroup: function () {
            return this.item.type == "Group";
        }
    },
    methods: {
        setGroup: function (isGroup) {
            console.log("setGroup");
            if (isGroup) {
                this.item.basetype = this.item.type;
                this.item.type = "Group";
            } else {
                this.item.type = (this.item.basetype ? this.item.basetype : "String");
            }
        },
        setType: function (type) {
            if (this.item.type == "Group") {
                this.item.basetype = type;
            } else {
                this.item.type = type;
            }
        },
        sendCommand: function () {
            const command = this.$el.querySelector("input.commandInput").value;
            this.message = null;
            this.messagetitle = "Sending '" + command + "'";
            this.inProgress = true;
            setTimeout(() => {
                fetchMethodWithTimeout(store.host + "/rest/items/" + this.item.name, "POST", command, "text/plain")
                    .then(r => {
                        this.message = "Command '" + command + "' send";
                    }).catch(e => {
                        console.log(e);
                        if (e.status && e.status == 400) {
                            this.message = "Command not applicable for item type!";
                        } else
                            this.message = e.toString();
                    })
            }, 500);
        },
        removeItem: function () {
            this.message = null;
            this.messagetitle = "Removing item...";
            this.inProgress = true;
            setTimeout(() => {
                fetchMethodWithTimeout(store.host + "/rest/items/" + this.item.name, "DELETE", null)
                    .then(r => {
                        this.message = "Item '" + this.item.label + "' removed";
                    }).catch(e => {
                        this.message = e.toString();
                    })
            }, 500);
        },
        saveItem: function () {
            this.message = null;
            this.messagetitle = "Saving item...";
            this.inProgress = true;
            this.changed = false;
            setTimeout(() => {
                fetchMethodWithTimeout(store.host + "/rest/items/" + this.item.name, "PUT", JSON.stringify(this.item))
                    .then(r => {
                        this.message = "Item '" + this.item.label + "' saved";
                    }).catch(e => {
                        this.message = e.toString();
                    })
            }, 500);
        },
    }
}

const mixins = [ItemsMixin];
const listmixins = [];
const runtimekeys = ["link", "editable", "state"];
const ID_KEY = "name";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
