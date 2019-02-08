import { store, fetchMethodWithTimeout, openhabHost } from '../app.js';

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

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "items": "items" } };
    sortStore() { return "items" };
    getall(options = null) {
        return store.get("item-types")
            .then(json => this.itemtypes = json)
            .then(() => store.get("item-group-function-types"))
            .then(v => this.functiontypes = v)
            .then(() => store.get("config-descriptions", null, { filter: "uri:metadata" }))
            .then(v => this.config = v)
            .then(() => this.get(options))
    }
    get(options = null) {
        return store.get("items", null, options).then(items => this.items = items);
    }
    dispose() {
    }
    getAllowedStates(itemtype) {
        for (let t of this.itemtypes) {
            if (t.id == itemtype) {
                return t.allowedStates;
            }
        }
        return [];
    }
    getCommands(itemtype) {
        for (let t of this.itemtypes) {
            if (t.id == itemtype) {
                return t.commands || [];
            }
        }
        return [];
    }
}

const ItemsMixin = {
    computed: {
        isGroup: function () {
            return this.item.type == "Group";
        },
        iconpath: function () {
            if (this.item.category) {
                return openhabHost() + "/icon/" + this.item.category;
            }
            return null;
        },
        itemcommands() {
            let commands = this.$root.store.getCommands(this.item.groupType ? this.item.groupType : this.item.type);
            if (commands.length)
                return commands.join(",");
            return "";
        },
        groupfunctions() {
            return this.$root.store.functiontypes.filter(e => e.compatible.length == 0 || e.compatible.includes(this.item.groupType));
        },
        hasFunctionParameters() {
            if (!this.item.function || !this.item.function.name) return false;
            let fun = this.$root.store.functiontypes.find(e => e.id == this.item.function.name);
            return (fun && fun.params);
        },
        functionparameters() {
            let fun = this.$root.store.functiontypes.find(e => e.id == this.item.function.name);
            if (!fun || !fun.params) return [];
            var params = [];
            for (let i = 0; i < fun.params.length; ++i) {
                let param = fun.params[i];
                const value = (this.item.function.params && this.item.function.params.length > i) ? this.item.function.params[i] : null;
                let allowedStates = this.$root.store.getAllowedStates(this.item.groupType);
                if (allowedStates.length) allowedStates = allowedStates.join(",");
                params.push(Object.assign({ value, allowedStates }, param));
            }
            return params;
        },
        namespaces: function () {
            if (!this.item.metadata) return []
            let result = [];
            const configs = this.$root.store.config;
            let namespaces = Object.keys(this.item.metadata);
            for (const namespaceName of namespaces) {
                const namespace = this.item.metadata[namespaceName];
                const config = configs ? configs.find(e => e.uri == "metadata:" + namespaceName) : null;
                const values = config ? config.parameters : [];
                for (let value of values) {
                    if (namespace[value.name]) {
                        value.value = namespace[value.name];
                        const option = value.options ? value.options.find(o => o.value === value.value) : null;
                        if (option) value.value = option.label;
                    }
                }
                result.push({ name: namespaceName, values: values })
            }
            return result;
        }
    },
    methods: {
        commontags: function () {
            return ["Switchable", "Lighting", "ColorLighting"];
        },
        setGroup: function (groupType) {
            if (groupType != "-")
                this.$set(this.item, "groupType", groupType);
            else
                this.$delete(this.item, "groupType");
        },
        setGroupFunction: function (value) {
            if (value)
                this.$set(this.item, "function", value);
            else
                this.$delete(this.item, "function");
        },
        setFunctionParameter(index, value) {
            if (!this.item.function) return;
            if (!this.item.function.params)
                $set(this.item.function, 'params', [].fill(null, 0, index));

            this.item.function.params[index] = value;
        },
        sendCommand: function () {
            const command = this.$el.querySelector(".commandInput").value;
            this.message = null;
            this.messagetitle = "Sending: '" + command + "'";
            this.inProgress = true;
            fetchMethodWithTimeout(store.host + "/rest/items/" + this.item.name, "POST", command, "text/plain")
                .then(r => {
                    this.messagetitle = "Success '" + command + "'";
                    setTimeout(() => {
                        this.inProgress = false;
                    }, 700);
                }).catch(e => {
                    console.log(e);
                    if (e.status && e.status == 400) {
                        this.message = "Command not applicable for item type!";
                    } else
                        this.message = e.toString();
                })

        },
        remove: function () {
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
        save: function () {
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

const ItemListMixin = {
    computed: {
        groupItems: function () {
            return this.items.filter(e => e.type == 'Group');
        },
        itemtypes() {
            return this.store.itemtypes;
        },
        grouptypes() {
            return this.store.itemtypes.filter(e => e.group);
        }
    },
};

const mixins = [ItemsMixin];
const listmixins = [ItemListMixin];
const runtimekeys = ["link", "editable", "state"];
const ID_KEY = "name";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };
