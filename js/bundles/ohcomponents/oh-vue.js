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

        this.tmpl = tmpEl.content;
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
    start(databaseStore, schema = null, runtimeKeys = null) {
        if (!this.ok) return;

        this.vue = new Vue({
            created: function () {
                this.store = databaseStore;
                this.runtimeKeys = runtimeKeys;
                this.modelschema = schema;
            },
            mixins: [UIFilterbarMixin, UIEditorMixin],
            template: this.tmpl,
            data: function () {
                return {
                    objectdata: {},
                    pending: true, // No data yet
                    pendingwait: false, // No data yet and some time passed already
                    error: false,
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
        this.vue.objectdata = val;
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
