// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

const demoItems = [
    {
        "flag": "NEW",
        "label": "MQTT Broker",
        "properties": {
            "host": "127.0.0.1",
            "port": 1883.0
        },
        "representationProperty": "host",
        "thingUID": "mqtt:broker:127_0_0_1_1883",
        "thingTypeUID": "mqtt:broker"
    },
    {
        "flag": "NEW",
        "label": "Homie Device 'Lightsource'",
        "properties": {
            "host": "192.168.1.8",
            "port": 1883.0
        },
        "representationProperty": "host",
        "thingUID": "mqtt:broker:192_168_1_8_1883",
        "thingTypeUID": "mqtt:broker"
    },
    {
        "flag": "NEW",
        "label": "A ping device on 192.168.1.12:22",
        "properties": {
            "host": "192.168.1.12",
            "port": 1883.0
        },
        "representationProperty": "host",
        "thingUID": "network:broker:192_168_1_8_1883",
        "thingTypeUID": "network:broker"
    }
];


const demoThingTypes = [
    {
        "UID": "mqtt:topic",
        "label": "Generic MQTT Thing",
        "description": "Add different types of channels, linked to MQTT topics, to this Thing",
        "listed": true,
        "supportedBridgeTypeUIDs": [
            "mqtt:broker",
            "mqtt:systemBroker"
        ],
        "bridge": false
    },
    {
        "UID": "mqtt:homeassistant",
        "label": "A HomeAssistant MQTT Component",
        "description": "This thing represents a HomeAssistant MQTT Component",
        "listed": true,
        "supportedBridgeTypeUIDs": [
            "mqtt:broker",
            "mqtt:systemBroker"
        ],
        "bridge": false
    },
    {
        "UID": "mqtt:homie300",
        "label": "A Homie (version 3.x) device",
        "description": "This thing represents a MQTT Homie device",
        "listed": true,
        "supportedBridgeTypeUIDs": [
            "mqtt:broker",
            "mqtt:systemBroker"
        ],
        "bridge": false
    },
    {
        "UID": "mqtt:broker",
        "label": "MQTT Broker",
        "description": "A connection to a MQTT broker",
        "listed": true,
        "supportedBridgeTypeUIDs": [],
        "bridge": true
    },
    {
        "UID": "mqtt:systemBroker",
        "label": "System MQTT Broker",
        "description": "A system configured and therefore read-only broker connection. Properties are reflecting the configuration and internal connection status.",
        "listed": true,
        "supportedBridgeTypeUIDs": [],
        "bridge": true
    },
    {
        "UID": "network:broker",
        "label": "A network ping device",
        "description": "Pings a network device periodically",
        "listed": true,
        "supportedBridgeTypeUIDs": [],
        "bridge": true
    }
];

const demoBindings = [
    {
        "author": "David Graeff",
        "description": "Link MQTT topics to things",
        "id": "mqtt",
        "name": "MQTT Thing Binding"
    },
    {
        "author": "David Graeff",
        "description": "Ping network devices",
        "id": "network",
        "name": "Network Binding"
    }
];

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