
const demoItems = [
    {
        "statusInfo": {
            "status": "ONLINE",
            "statusDetail": "NONE"
        },
        "editable": true,
        "label": "Generic MQTT Thing",
        "bridgeUID": "mqtt:systemBroker:embedded-mqtt-broker",
        "configuration": {},
        "properties": {},
        "UID": "mqtt:topic:3edb5737",
        "thingTypeUID": "mqtt:topic",
        "channels": [
            {
                "linkedItems": [
                    "mqtt_topic_3edb5737_testtext"
                ],
                "uid": "mqtt:topic:3edb5737:testtext",
                "id": "testtext",
                "channelTypeUID": "mqtt:String",
                "itemType": "String",
                "kind": "STATE",
                "label": "Test Text",
                "defaultTags": [],
                "properties": {},
                "configuration": {
                    "stateTopic": "test/text"
                }
            },
            {
                "linkedItems": [
                    "mqtt_topic_3edb5737_testnumber"
                ],
                "uid": "mqtt:topic:3edb5737:testnumber",
                "id": "testnumber",
                "channelTypeUID": "mqtt:Number",
                "itemType": "Number",
                "kind": "STATE",
                "label": "Test number",
                "defaultTags": [],
                "properties": {},
                "configuration": {
                    "commandTopic": "test/number/set",
                    "stateTopic": "test/number",
                    "step": 1.0
                }
            },
            {
                "linkedItems": [
                    "mqtt_topic_3edb5737_testswitch"
                ],
                "uid": "mqtt:topic:3edb5737:testswitch",
                "id": "testswitch",
                "channelTypeUID": "mqtt:Switch",
                "itemType": "Switch",
                "kind": "STATE",
                "label": "Test switch",
                "defaultTags": [],
                "properties": {},
                "configuration": {
                    "commandTopic": "test/switch/set",
                    "stateTopic": "test/switch"
                }
            },
            {
                "linkedItems": [
                    "mqtt_topic_3edb5737_multistate"
                ],
                "uid": "mqtt:topic:3edb5737:multistate",
                "id": "multistate",
                "channelTypeUID": "mqtt:EnumSwitch",
                "itemType": "Switch",
                "kind": "STATE",
                "label": "Multi State",
                "defaultTags": [],
                "properties": {},
                "configuration": {
                    "allowedStates": "AAA,BBB,CCC",
                    "commandTopic": "test/multi/set",
                    "stateTopic": "test/multi"
                }
            }
        ]
    }
];

const demoChannelTypes = [
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to. This can be left empty",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "If your MQTT topic is limited to a set of one or more specific commands or specific states, define those states here. Separate multiple states with commas. An example for a light bulb state set: ON,DIMMED,OFF",
                "label": "Allowed states",
                "name": "allowedStates",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "Text value",
        "itemType": "String",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:String",
        "advanced": false
    },
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to. This can be left empty",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "10.0",
                "description": "The step value is used if the value channel is bound to a Dimmer item and an increase/decrease is issued",
                "label": "Step value",
                "name": "step",
                "required": false,
                "type": "DECIMAL",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "false",
                "description": "Set to true if the MQTT topic expects a float/double decimal instead of an integer value",
                "label": "Is Decimal?",
                "name": "isfloat",
                "required": false,
                "type": "BOOLEAN",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "Number value",
        "itemType": "Number",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:Number",
        "advanced": false
    },
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to. This can be left empty",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "0.0",
                "description": "Minimum value to convert the MQTT state to a percentage",
                "label": "Minimum value",
                "name": "min",
                "required": false,
                "type": "DECIMAL",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "100.0",
                "description": "Maximum value to convert the MQTT state to a percentage",
                "label": "Maximum value",
                "name": "max",
                "required": false,
                "type": "DECIMAL",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "10.0",
                "description": "The step value is used if the value channel is bound to a Dimmer item and an increase/decrease is issued",
                "label": "Step value",
                "name": "step",
                "required": false,
                "type": "DECIMAL",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "false",
                "description": "Set to true if the MQTT topic expects a float/double decimal instead of an integer value",
                "label": "Is Decimal?",
                "name": "isfloat",
                "required": false,
                "type": "BOOLEAN",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "Percentage value",
        "itemType": "Dimmer",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:Dimmer",
        "advanced": false
    },
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to.",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": true,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "0",
                "description": "A number (like 1, 10) or a string (like ON) that is recognised as on state.",
                "label": "ON value",
                "name": "on",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "1",
                "description": "A number (like 0, -10) or a string (like OFF) that is recognised as off state.",
                "label": "OFF value",
                "name": "off",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "false",
                "description": "Inverse the meaning. A received \"ON\" will switch the thing channel off and vice versa.",
                "label": "Inverse",
                "name": "inverse",
                "required": false,
                "type": "BOOLEAN",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "On/Off switch",
        "itemType": "Switch",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:Switch",
        "advanced": false
    },
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to.",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": true,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "ON,DIMMED,OFF",
                "description": "List all valid states. Separate multiple states with commas. An example for a light bulb state set: ON,DIMMED,OFF",
                "label": "Allowed states",
                "name": "allowedStates",
                "required": true,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "Multi-state switch",
        "itemType": "Switch",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:EnumSwitch",
        "advanced": false
    },
    {
        "parameters": [
            {
                "description": "An MQTT topic that this thing will subscribe to, to receive the state.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": true,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "0",
                "description": "A number (like 1, 10) or a string (like \"open\") that is recognised as on state.",
                "label": "Open value",
                "name": "open",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "1",
                "description": "A number (like 0, -10) or a string (like \"close\") that is recognised as off state.",
                "label": "Close value",
                "name": "close",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "label": "Open/Close contact",
        "itemType": "Contact",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:Contact",
        "advanced": false
    },
    {
        "parameters": [
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will subscribe to, to receive the state. This can be left empty, the thing will be state-less then.",
                "label": "MQTT state topic",
                "name": "stateTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "An MQTT topic that this thing will send a command to. This can be left empty",
                "label": "MQTT command topic",
                "name": "commandTopic",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": false,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "",
                "description": "Any supported transformation can be used. An example for a received JSON from a MQTT state topic would be a pattern of JSONPATH:$.device.status.temperature for a json {device: {status: { temperature: 23.2 }}}.",
                "label": "Transformation pattern",
                "name": "transformationPattern",
                "required": false,
                "type": "TEXT",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            },
            {
                "defaultValue": "false",
                "description": "The channel will send updates as RGB values and expects RGB values from the state topic.",
                "label": "RGB instead of HSV",
                "name": "rgb",
                "required": false,
                "type": "BOOLEAN",
                "readOnly": false,
                "multiple": false,
                "advanced": true,
                "verify": false,
                "limitToOptions": true,
                "options": [],
                "filterCriteria": []
            }
        ],
        "parameterGroups": [],
        "description": "",
        "label": "Color value",
        "itemType": "Color",
        "kind": "STATE",
        "tags": [],
        "UID": "mqtt:Color",
        "advanced": false
    }
];


//TODO channel types

// demoChannelTypes
const ThingChannelsMixin = {
    methods: {
        binding(item) {
            const bindingid = item.thingTypeUID.split(":")[0];
            for (const binding of demoBindings) {
                if (binding.id == bindingid)
                return binding.name;
            }
            return "Binding not found";
        },
        description(item) {
            for (const thingType of demoThingTypes) {
                if (thingType.UID == item.thingTypeUID)
                return thingType.description;
            }
            return "No Thing description available";
        }
    }
}

window.loadThingChannels = function (vueList) {
    calledOnce = true;
    vueList.start([ThingChannelsMixin], null, null, []);
    vueList.items = demoItems[0].channels;
};

var calledOnce = false;
var el = document.getElementById("thingchannelsapp");
if (el && !calledOnce) loadThingChannels(el);
