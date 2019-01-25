// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/items.json").then(response => response.json());
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
    created: function () {
        this.itemtypes = {
            "Color": "<b>Color</b><br>Color information",
            "Contact": "<b>Contact</b><br>Read-only status of contacts, e.g. door/window contacts.",
            "DateTime": "<b>DateTime</b><br>Stores date and time",
            "Dimmer": "<b>Dimmer</b><br>Percentage value, typically used for dimmers",
            "Image": "<b>Image</b><br>Binary data of an image",
            "Location": "<b>Location</b><br>GPS coordinates",
            "Number": "<b>Number</b><br>Values in number format",
            "Player": "<b>Player</b><br>Allows control of players (e.g. audio players)",
            "Rollershutter": "<b>Rollershutter</b><br>Roller shutter Item, typically used for blinds",
            "String": "<b>String</b><br>Stores texts",
            "Switch": "<b>Switch</b><br>Used for anything that needs to be switched ON and OFF",
        }
    },
    computed: {
        itemtype: function() {
            if (this.item.type=="Group") return (this.item.basetype ? this.item.basetype : "String");
            return this.item.type;
        },
        isGroup: function() {
            return this.item.type=="Group";
        }
    },
    methods: {
        setGroup: function(isGroup) {
            console.log("setGroup");
            if (isGroup) {
                this.item.basetype = this.item.type;
                this.item.type = "Group";
            } else {
                this.item.type = (this.item.basetype ? this.item.basetype : "String");
            }
        },
        setType: function(type) {
            if (this.item.type=="Group") {
                this.item.basetype = type;
            } else {
                this.item.type = type;
            }
        }
    }
}

const mixins = [ItemsMixin];

const runtimekeys = ["link", "editable", "state"];

export {mixins, schema, runtimekeys, StoreView};
