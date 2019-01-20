// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { Vue } from './vue.js'; // Pre-bundled, external reference

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

function start() {
    if (!document.getElementById("itemsapp")) return;
    // new Vue({
    //     store,
    //     el: '#itemsapp',
    //     template: '#postTemplate',
    //     created() {
    //         this.getPosts();
    //     },
    //     // make states available
    //     computed: mapState("demo", {
    //         posts: state => state.posts,
    //         pending: state => state.pending,
    //         error: state => state.error
    //     }),
    //     methods: {
    //         ...mapActions({
    //             getPosts: "demo/listPosts"
    //         })
    //     }
    // });
    new Vue({
        el: '#itemsapp',
        template: '#listTemplate',
        data: function () { return { items: demoItems, pending: false, error: false } }
    });
}

document.addEventListener("DOMContentLoaded", () => start());
if (['interactive', 'complete'].includes(document.readyState)) start();
