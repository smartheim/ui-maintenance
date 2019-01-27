import { Vue } from './vue.js'; // Pre-bundled, external reference
import { UIFilterbarMixin, UIEditorMixin } from './oh-vue-list-mixins';

Vue.config.ignoredElements = [
    /^oh-/, /^ui-/
]

/**
 * A vue rendered list of times component. The template id for items
 * must be given as an argument "template". Several mixins are included
 * by default to allow a filter-bar, a text editor for items etc.
 * 
 * This component renders nothing until start() is called.
 */
class OhVue extends HTMLElement {
    constructor() {
        super();
        this.ok = false;
        this.vue = {};
    }
    connectedCallback() {
        const forid = this.getAttribute("for");
        var tmpEl = document.getElementById(forid);
        if (!tmpEl) {
            tmpEl = this.nextElementSibling;
        }
        if (!tmpEl) {
            this.innerHTML = "<div>Template required</div>";
            return;
        }

        this.tmpl = tmpEl;
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
     * @param {JSON} schema A json schema
     * @param {String[]} runtimeKeys A list of mixin objects
     */
    start(databaseStore, mixins, schema = null, runtimeKeys = null) {
        if (!this.ok) return;

        this.vue = new Vue({
            created: function () {
                this.store = databaseStore;
                this.runtimeKeys = runtimeKeys;
                this.modelschema = schema;
                this.ignoreWatch = false;
            },
            mixins: [UIFilterbarMixin, UIEditorMixin, ...mixins],
            template: this.tmpl,
            data: function () {
                return {
                    objectdata: {},
                    pending: true, // No data yet
                    pendingwait: false, // No data yet and some time passed already
                    error: false,
                    changed: false,
                }
            },
            computed: {
                unchanged: function () {
                    return !this.changed;
                }
            },
            watch: {
                objectdata: {
                    handler: function (newVal, oldVal) {
                        if (this.ignoreWatch) {
                            this.ignoreWatch = false;
                            return;
                        }
                        this.changed = true;
                    }, deep: true, immediate: true,
                }
            },
            mounted: function () {
                setTimeout(() => {
                    if (this.pending)
                        this.pendingwait = true;
                }, 1000);
            }
        }).$mount(this.appendChild(document.createElement("div")));
    }

    set error(e) {
        this.vue.error = e.toString();
        this.vue.pending = false;
        this.vue.pendingwait = false;
    }

    set objectdata(val) {
        this.vue.ignoreWatch = true;
        this.vue.objectdata = val;
        this.vue.error = false;
        this.vue.changed = false;
        this.vue.pending = false;
        this.vue.pendingwait = false;
    }
    get objectdata() {
        return this.vue.objectdata;
    }
    set modelschema(val) {
        this.vue.modelschema = val;
    }
    set runtimeKeys(val) {
        this.vue.runtimeKeys = val;
    }
}

customElements.define('oh-vue', OhVue);
