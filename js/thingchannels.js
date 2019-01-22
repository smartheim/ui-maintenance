
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

//TODO channel types

const InboxMixin = {
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

window.loadInbox = function (vueList) {
    calledOnce = true;
    vueList.start([InboxMixin], null, null, []);
    vueList.items = demoItems;
};

var calledOnce = false;
var el = document.getElementById("inboxapp");
if (el && !calledOnce) loadInbox(el);