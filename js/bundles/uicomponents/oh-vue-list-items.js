import { Vue } from './vue.js'; // Pre-bundled, external reference
import { UIFilterbarMixin, UIEditorMixin } from './oh-vue-list-mixins';

Vue.config.ignoredElements = [
    /^oh-/, /^ui-/
]

var OHListItemsWithID = {
    methods: {
        copyClipboard: function (event, itemid) {
            var range = document.createRange();
            range.selectNode(event.target);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand("copy");

            var el = document.createElement("ui-notification");
            el.id = "clipboard";
            el.setAttribute("close-time", 3000);
            el.innerHTML = `Copied ${itemid} to clipboard`;
            document.body.appendChild(el);
        }
    }
}

/**
 * A vue rendered list of times component. The template id for items
 * must be given as an argument "template". Several mixins are included
 * by default to allow a filter-bar, a text editor for items etc.
 * 
 * This component renders nothing until start() is called.
 */
class OhViewList extends HTMLElement {
    constructor() {
        super();
    }

    /**
     * Create the vue instance and render the list.
     * 
     * Usage: [ThingsMixin], 'http://openhab.org/schema/things-schema.json', schema, ["link","editable","statusInfo","properties"]
     * 
     * @param {Object[]} mixinList A list of mixin objects
     * @param {String} schema_uri A validation schema uri
     * @param {JSON} schema A json schema
     * @param {String[]} runtimeKeys A list of mixin objects
     */
    start(mixinList, schema_uri = null, schema = null, runtimeKeys = null) {
        const template = this.getAttribute("template");
        if (!template) {
            this.innerText = "No template id given!";
            return;
        }
        var el = document.createElement("div");
        this.appendChild(el);
        this.vue = new Vue({
            mixins: [OHListItemsWithID, UIFilterbarMixin, UIEditorMixin, ...mixinList],
            template: '#' + template,
            data: function () { return { items: [], pending: true, error: false } },
            methods: {
                changed: function (item) {
                    Vue.set( item, "changed_", true );
                },
                save: function (item) {
                    Vue.set( item, "storing_", true );
                }
            }
        }).$mount(this.childNodes[0]);
        this.vue.filtercriteria = this.getAttribute("filtercriteria");
        this.vue.modelschema = schema;
        this.vue.modeluri = schema_uri;
        this.vue.runtimeKeys = runtimeKeys;
    }
    connectedCallback() {
        this.dispatchEvent(new Event("load"));
    }
    set items(val) {
        this.vue.items = val;
        this.vue.pending = false;
    }
    get items() {
        return this.vue.items;
    }
    set modelschema(val) {
        this.vue.modelschema = val;
    }
    set modeluri(val) {
        this.vue.modeluri = val;
    }
    set runtimeKeys(val) {
        this.vue.runtimeKeys = val;
    }
}
customElements.define('oh-vue-list-items', OhViewList);
