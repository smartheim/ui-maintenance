// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

const demoItems = [
        {
            "status": {
                "status": "UNINITIALIZED",
                "statusDetail": "HANDLER_INITIALIZING_ERROR",
                "description": "Getting handler \u0027timer.DayOfWeekCondition\u0027 for module \u00273\u0027 failed: \u0027days\u0027 parameter must be an array of strings.\n"
            },
            "triggers": [
                {
                    "id": "1",
                    "label": "an item state changes",
                    "description": "This triggers the rule if an item state has changed.",
                    "configuration": {
                        "itemName": "mqtt_topic_3edb5737_testnumber",
                        "state": "1",
                        "previousState": "0"
                    },
                    "type": "core.ItemStateChangeTrigger"
                }
            ],
            "actions": [
                {
                    "inputs": {},
                    "id": "2",
                    "label": "send a command",
                    "description": "Sends a command to a specified item.",
                    "configuration": {
                        "itemName": "mqtt_topic_3edb5737_testtext",
                        "command": "ON"
                    },
                    "type": "core.ItemCommandAction"
                }
            ],
            "configuration": {},
            "configDescriptions": [],
            "uid": "dacfa98c-6a39-4889-8bcb-fa7aec69397e",
            "name": "test",
            "tags": [],
            "visibility": "VISIBLE",
            "description": "MQTT eventbus",
            "runcounter": 0
        },
        {
            "status": {
                "status": "IDLE",
                "statusDetail": "",
                "description": ""
            },
            "triggers": [],
            "actions": [],
            "configuration": {},
            "configDescriptions": [],
            "uid": "dacfa98c-6a39-4889-8bcb-fa7aec69397e",
            "name": "My first rule",
            "tags": [],
            "visibility": "VISIBLE",
            "description": "Will do super important stuff. Click me now.",
            "runcounter": 18
        },
        {
            "status": {
                "status": "IDLE",
                "statusDetail": "",
                "description": ""
            },
            "triggers": [],
            "actions": [],
            "configuration": {},
            "configDescriptions": [],
            "uid": "dacfa98c-6a39-4889-8bcb-fa7aec69397e",
            "name": "Another rule",
            "tags": [],
            "visibility": "VISIBLE",
            "description": "Very important rule for sensors and stuff.",
            "runcounter": 2
        }
];

const demoScripts = [
    {
        "filename": "a_script_file.js",
        "name": "My cool js script"
    }
];

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
        rulesStatusinfo: function (item) { return item.status ? item.status.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown"; },
        rulesStatusDetails: function (item) { return item.status ? item.status.statusDetail : ""; },
        rulesStatusmessage: function (item) { return item.status ? item.status.description : ""; }, //TODO
        rulesStatusBadge: function (item) {
            const status = item.status ? item.status.status : "";
            switch (status) {
                case "RUNNING": return "badge badge-success";
                case "UNINITIALIZED": return "badge badge-danger";
                case "IDLE": return "badge badge-info";
            }
            return "badge badge-light";
        },
    }
}

var calledOnce = false;
window.loadRules = function (vueList) {
    calledOnce = true;
    vueList.start([RulesMixin], 'http://openhab.org/schema/rules-schema.json', schema, ["link","editable","status","runcounter"]);
    vueList.items = demoItems;
};

window.loadScripts = function (vueList) {
    vueList.start([], null, null, ["link","editable"]);
    vueList.items = demoScripts;
};

var el = document.getElementById("rulesapp");
if (el && !calledOnce) {
    loadRules(el);
    loadScripts(document.getElementById("scriptsapp"));
}