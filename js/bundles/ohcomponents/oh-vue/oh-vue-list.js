import { Vue } from '../vue.js'; // Pre-bundled, external reference
import { createNotification } from '../app.js'; // Pre-bundled, external reference
import { UIFilterbarMixin, UIEditorMixin } from './oh-vue-list-mixins';
import { OhListStatus } from './oh-vue-list-status'
import VueInProgress from './vue-inprogress';
import PortalVue from './portal-vue.mjs'

Vue.use(PortalVue);
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
                message: null,
                messagetitle: null,
            }
        },
        mixins: [...mixins],
        components: {
            'vue-inprogress': VueInProgress
        },
        methods: {
            save: function () {
                this.message = null;
                this.messagetitle = "Saving...";
                this.inProgress = true;
                this.changed = false;
                setTimeout(() => this.inProgress = false, 1000);
            },
            remove: function () {
                this.message = null;
                this.messagetitle = "Removing...";
                this.inProgress = true;
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

                createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
            }
        },
        watch: {
            // The database entry has changed -> warn the user if he has made changes
            listitem: {
                handler: function (newVal, oldVal) {
                    this.original = newVal;
                    if (!this.changed) {
                        this.ignoreWatch = true;
                        this.item = Object.assign({}, this.original);
                        this.inProgress = false;
                        this.changed = false;
                    } else {
                        this.message = "If you save your changes, you'll overwrite the newer version.";
                        this.messagetitle = "Warning: Update received";
                        this.inProgress = true;
                    }
                }, deep: true, immediate: true,
            },
            item: {
                handler: function (newVal, oldVal) {
                    if (this.ignoreWatch) {
                        this.ignoreWatch = false;
                        console.debug("ignore watch");
                        return;
                    }
                    console.debug("list item changed", newVal);
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
 * A vue rendered list of items components. Several mixins are included
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

        this.mountEl = this.shadowRoot.querySelector('slot[name="app"]').assignedNodes()[0];
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
     * @param {Object[]} listmixins A list of mixin objects for the list component
     * @param {Object[]} itemMixins A list of mixin objects for item components of the list
     * @param {JSON} schema A json schema
     * @param {String[]} runtimeKeys A list of mixin objects
     */
    start(adapter, listmixins, itemMixins, schema = null, runtimeKeys = null) {
        if (!this.ok) return;

        const filtercriteria = this.getAttribute("filtercriteria");
        const maxFilteredItems = this.hasAttribute("maxFilteredItems") ? this.getAttribute("maxFilteredItems") : null;
        this.vue = new Vue({
            created: function () {
                this.OhListStatus = OhListStatus;
                this.store = adapter;
                this.runtimeKeys = runtimeKeys;
                this.filtercriteria = filtercriteria;
                this.modelschema = schema;
                if (maxFilteredItems) this.maxFilteredItems = parseInt(maxFilteredItems);
            },
            mixins: [UIFilterbarMixin, UIEditorMixin, ...listmixins],
            template: this.listTmpl,
            data: function () {
                return Object.assign(adapter, {
                    message: "",
                    status: OhListStatus.READY,
                });
            },
            computed: {
                empty: function () {
                    return this.items.length == 0;
                }
            },
            components: {
                'oh-vue-listitem': createItemComponent(itemMixins, this.itemTmpl.cloneNode(true))
            },
            mounted: function () {
                this.$el.setAttribute("slot", "app");
            }
        }).$mount(this.mountEl);
        this.pending = true;
    }

    set pending(val) {
        this.vue.status = OhListStatus.PENDING;
        setTimeout(() => {
            if (this.vue.status == OhListStatus.PENDING)
                this.vue.status = OhListStatus.PENDING_WAITING;
        }, 1000);
    }
    set error(e) {
        this.vue.message = e.toString();
        this.vue.status = OhListStatus.ERROR;
    }
    connectionState(connected, message) {
        this.vue.message = message;
        if (!connected) {
            this.vue.status = OhListStatus.NOTCONNECTED;
            setTimeout(() => {
                if (this.vue.status == OhListStatus.NOTCONNECTED)
                    this.vue.status = OhListStatus.NOTCONNECTED_WAITING;
            }, 1000);
            this.vue.items = [];
        } else if (this.vue.status != OhListStatus.READY) {
            this.pending = true;
        }
    }
    set modelschema(val) {
        this.vue.modelschema = val;
    }
    set runtimeKeys(val) {
        this.vue.runtimeKeys = val;
    }
}

customElements.define('oh-vue-list', OhViewList);
