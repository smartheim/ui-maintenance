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