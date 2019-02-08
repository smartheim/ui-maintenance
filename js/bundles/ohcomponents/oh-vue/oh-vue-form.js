import { Vue } from '../vue.js'; // Pre-bundled, external reference
import { OhListStatus } from './oh-vue-list-status'
import VueConfigElement from './vue-config-element';

Vue.config.ignoredElements = [
    /^oh-/, /^ui-/
]

/**
 * A vue rendered form component.
 * 
 * This component renders nothing until start() is called.
 */
class OhVueForm extends HTMLElement {
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
    start(adapter, mixins, schema = null, runtimeKeys = null) {
        if (!this.ok) return;

        this.vue = new Vue({
            created: function () {
                this.OhListStatus = OhListStatus;
                this.store = adapter;
                this.runtimeKeys = runtimeKeys;
                this.modelschema = schema;
                this.ignoreWatch = false;
            },
            mixins: [...mixins],
            components: {
                'vue-config-element': VueConfigElement
            },
            template: this.tmpl,
            data: function () {
                return Object.assign(adapter, {
                    message: "",
                    status: OhListStatus.PENDING,
                    changed: false,
                });
            },
            computed: {
                unchanged: function () {
                    return !this.changed;
                }
            },
            watch: {
                value: {
                    handler: function (newVal, oldVal) {
                        if (this.ignoreWatch) {
                            console.debug("oh-vue-form, ignore data change", newVal);
                            this.ignoreWatch = false;
                            return;
                        }
                        this.changed = true;
                    }, deep: true, immediate: true,
                }
            },
            mounted: function () {
                this.changed = false;
            }
        }).$mount(this.appendChild(document.createElement("div")));
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
                if (this.vue.status == OhListStatus.NOTCONNECTED) {
                    this.vue.status = OhListStatus.NOTCONNECTED_WAITING;
                    console.debug("not connected timeout");
                }
            }, 1000);
            this.vue.ignoreWatch = true;
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

customElements.define('oh-vue-form', OhVueForm);
