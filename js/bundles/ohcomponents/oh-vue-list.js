import { Vue } from './vue.js'; // Pre-bundled, external reference
import { UIFilterbarMixin, UIEditorMixin } from './oh-vue-list-mixins';

Vue.config.ignoredElements = [
    /^oh-/, /^ui-/
]

function createItemComponent(mixins, template) {
    return {
        ignoreWatch: false,
        props: ["listitem"],
        // Explicitly set the defaults, otherwise vue will do strange things with web-components
        model: { // Influences v-model behaviour: See https://vuejs.org/v2/api/#model
            prop: 'value',
            event: 'input'
        },
        template: template,
        data: function () {
            return {
                item: Object.assign({}, this.listitem),
                original: this.listitem,
                changed: false,
                inProgress: false,
                updatewhilechanged: false,
            }
        },
        mixins: [...mixins],
        methods: {
            save: function () {
                this.inProgress = true;
                this.changed = false;
                setTimeout(() => this.inProgress = false, 1000);
            },
            remove: function () {
                this.inProgress = true;
                console.log("remove click");
            },
            discard: function () {
                this.ignoreWatch = true;
                this.item = Object.assign({}, this.original);
                this.inProgress = false;
                this.changed = false;
                console.log("discarded");
            },
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
        },
        watch: {
            // The database entry has changed -> warn the user if he has made changes
            listitem: {
                handler: function (newVal, oldVal) {
                    this.original = newVal;
                    if (!this.changed) {
                        this.item = Object.assign({}, this.original);
                        this.inProgress = false;
                        this.changed = false;
                    } else {
                        this.updatewhilechanged = true;
                    }
                }, deep: true, immediate: true,
            },
            item: {
                handler: function (newVal, oldVal) {
                    if (this.ignoreWatch) {
                        this.ignoreWatch = false;
                        console.log("ignore watch");
                        return;
                    }
                    this.changed = true;
                }, deep: true, immediate: true,
            }
        },
        created: function () {
            this.changed = false;
            this.inProgress = false;
        }
    }
};

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
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        this.vue = {};
        this.ok = false;
        this.shadowRoot.innerHTML = `<slot name="app"></slot><slot name="list"></slot><slot name="item"></slot>`;
        var elList = this.shadowRoot.querySelector('slot[name="list"]');
        var elItem = this.shadowRoot.querySelector('slot[name="item"]');
        if (!elList || !elItem) {
            this.shadowRoot.innerHTML = "<div>No template slots given!</div>";
            return;
        }

        elList = elList.assignedNodes()[0];
        elItem = elItem.assignedNodes()[0];
        if (!elList || !elItem) {
            this.shadowRoot.innerHTML = "<div>Template slots must contain a template!</div>";
            return;
        }

        this.listTmpl = elList;
        this.itemTmpl = elItem;

        var appEl = this.shadowRoot.querySelector('slot[name="app"]').assignedNodes()[0];
        var child = document.createElement("div");
        this.mountEl = appEl.appendChild(child);
        this.ok = true;
        this.dispatchEvent(new Event("load"));
    }
    /**
     * Create the vue instance and render the list.
     * 
     * Usage: [ThingsMixin], schema, ["link","editable","statusInfo","properties"]
     * 
     * @param {Object} databaseStore A store view. This is available for item components and
     *      item mixins with `this.$parent.store`.
     * @param {Object[]} itemMixins A list of mixin objects for item components of the list
     * @param {JSON} schema A json schema
     * @param {String[]} runtimeKeys A list of mixin objects
     */
    start(databaseStore, itemMixins, schema = null, runtimeKeys = null) {
        if (!this.ok) return;

        const filtercriteria = this.getAttribute("filtercriteria");
        const maxFilteredItems = this.hasAttribute("maxFilteredItems") ? this.getAttribute("maxFilteredItems") : null;
        this.vue = new Vue({
            created: function () {
                this.store = databaseStore;
                this.runtimeKeys = runtimeKeys;
                this.filtercriteria = filtercriteria;
                this.modelschema = schema;
                if (maxFilteredItems) this.maxFilteredItems = parseInt(maxFilteredItems);
            },
            mixins: [UIFilterbarMixin, UIEditorMixin],
            template: this.listTmpl,
            data: function () {
                return {
                    items: [],
                    pending: true, // No data yet
                    pendingwait: false, // No data yet and some time passed already
                    error: false,
                }
            },
            components: {
                'oh-vue-listitem': createItemComponent(itemMixins, this.itemTmpl.cloneNode(true))
            },
            mounted: function () {
                setTimeout(() => {
                    if (this.pending)
                        this.pendingwait = true;
                }, 1000);
            }
        }).$mount(this.mountEl);
    }

    set error(e) {
        this.vue.error = e.toString();
        this.vue.pending = false;
        this.vue.pendingwait = false;
    }

    set items(val) {
        this.vue.error = false;
        this.vue.items = val;
        this.vue.pending = false;
        this.vue.pendingwait = false;
        this.vue.rebuildList();
    }
    get items() {
        return this.vue.items;
    }
    set modelschema(val) {
        this.vue.modelschema = val;
    }
    set runtimeKeys(val) {
        this.vue.runtimeKeys = val;
    }
}

customElements.define('oh-vue-list', OhViewList);
