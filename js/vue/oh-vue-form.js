import Vue from 'vue/dist/vue.esm.js';
import { createNotification } from './app.js'; // Pre-bundled, external reference

import { OhListStatus } from './oh-vue-list-status'
import VueConfigElement from '../_vuecomponents/vue-config-element.vue';
import { DynamicLoadMixin } from '../_vuecomponents/vue-mixin-dynamicload';

Vue.config.ignoredElements = [
  /^oh-/, /^ui-/
]

/**
 * @category Web Components (Reactive)
 * @customelement oh-vue-form
 * @description 
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
    const tmpEl = document.getElementById(forid) || this.nextElementSibling;
    if (!tmpEl) {
      this.innerHTML = "<div>Template required</div>";
      return;
    }

    this.tmpl = tmpEl;
    this.ok = true;
    this.dispatchEvent(new Event("load"));
  }
  disconnectedCallback() {
    if (this.vue && this.vue.destroyed) this.vue.destroyed();
  }
  /**
   * Create the vue instance and render the list.
   * 
   * Usage: [ThingsMixin], schema, ["link","editable","statusInfo","properties"]
   * 
   * @param {Object} databaseStore A store view. This is available for item components and
   *      item mixins with `this.$parent.store`.
   */
  start(adapter, mixins) {
    if (!this.ok) return;

    this.vue = new Vue({
      created: function () {
        this.OhListStatus = OhListStatus;
        this.store = adapter;
        this.ignoreWatch = false;
      },
      mixins: [...mixins, DynamicLoadMixin],
      components: {
        'vue-config-element': VueConfigElement
      },
      template: this.tmpl,
      data: function () {
        return Object.assign(adapter, {
          message: "",
          status: OhListStatus.PENDING,
          changed: false,
          valuecopy: {},
          modelschema: null
        });
      },
      methods: {
        undo() {
          this.changed = false;
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }))
          this.ignoreWatch = true;
          this.valuecopy = JSON.parse(JSON.stringify(this.value));
        }
      },
      computed: {
        unchanged: function () {
          return !this.changed;
        }
      },
      watch: {
        value: {
          handler: function (newVal, oldVal) {
            if (this.changed) {
              createNotification("clipboard", `Database has changed. Your current copy will overwrite it on save!`, true, 3000);
              return;
            }
            this.ignoreWatch = true;
            this.valuecopy = JSON.parse(JSON.stringify(this.value));
          }, deep: true, immediate: true,
        },
        valuecopy: {
          handler: function (newVal, oldVal) {
            if (this.ignoreWatch) {
              console.debug("oh-vue-form, ignore data change", newVal);
              this.ignoreWatch = false;
              return;
            }
            document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: true }))
            this.changed = true;
          }, deep: true, immediate: true,
        },
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
  updateContext(context) {
    this.vue.context = context;
  }
}

customElements.define('oh-vue-form', OhVueForm);
