// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'


const demoItems = [
    {
        "link": "http://192.168.1.8/rest/items/mqtt_topic_3edb5737_testswitch",
        "state": "ON",
        "editable": false,
        "type": "Switch",
        "name": "mqtt_topic_3edb5737_testswitch",
        "label": "Test switch",
        "tags": [],
        "groupNames": []
    },
    {
        "link": "http://192.168.1.8/rest/items/mqtt_topic_3edb5737_multistate",
        "state": "ON",
        "editable": false,
        "type": "Switch",
        "name": "mqtt_topic_3edb5737_multistate",
        "label": "Multi State",
        "tags": [],
        "groupNames": ["mainGroup"]
    },
    {
        "link": "http://192.168.1.8/rest/items/mqtt_topic_3edb5737_testnumber",
        "state": "0",
        "stateDescription": {
            "pattern": "%.0f",
            "readOnly": false,
            "options": []
        },
        "editable": false,
        "type": "Number",
        "name": "mqtt_topic_3edb5737_testnumber",
        "label": "Test number",
        "tags": [],
        "groupNames": []
    },
    {
        "link": "http://192.168.1.8/rest/items/mqtt_topic_3edb5737_testtext",
        "state": "",
        "stateDescription": {
            "pattern": "%s",
            "readOnly": false,
            "options": []
        },
        "editable": false,
        "type": "String",
        "name": "mqtt_topic_3edb5737_testtext",
        "label": "Test Text",
        "tags": ["Lighting"],
        "groupNames": []
    }
];

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
            "Color": "Color information",
            "Contact": "Status of contacts, e.g. door/window contacts. Does not accept commands, only status updates.",
            "DateTime": "Stores date and time",
            "Dimmer": "Percentage value, typically used for dimmers",
            "Image": "Binary data of an image",
            "Location": "GPS coordinates",
            "Number": "Values in number format",
            "Player": "Allows control of players (e.g. audio players)",
            "Rollershutter": "Roller shutter Item, typically used for blinds",
            "String": "Stores texts",
            "Switch": "Switch Item, used for anything that needs to be switched ON and OFF",
        }
    },
}

window.loadItems = function (vueList) {
    calledOnce = true;
    vueList.start([ItemsMixin], 'http://openhab.org/schema/items-schema.json', schema, ["link", "editable", "state"]);
    vueList.items = demoItems;
};

var calledOnce = false;
var el = document.getElementById("itemlist");
if (el && !calledOnce) loadItems(el);