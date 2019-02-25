import Vue from 'vue/dist/vue.esm.js';
import { OhListStatus } from './oh-vue-list-status'
import { createItemComponent } from './oh-vue-list-item';

import { EditorMixin } from '../_vuecomponents/vue-mixin-editor';
import { ListViewSelectionModeMixin } from '../_vuecomponents/vue-mixin-itemselection';
import { ListModeMixin } from '../_vuecomponents/vue-mixin-listmodes';

Vue.config.ignoredElements = [
  /^oh-/, /^ui-/
]

/**
 * @category Web Components (Reactive)
 * @customelement oh-vue-list
 * @description 
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
   * @param {Object[]} listmixins A list of mixin objects for the list component
   * @param {Object[]} itemMixins A list of mixin objects for item components of the list
   */
  start(adapter, listmixins, itemMixins) {
    if (!this.ok) return;

    const filtercriteria = this.getAttribute("filtercriteria");
    const fixedfilterAttr = this.hasAttribute("fixedfilter") ? this.getAttribute("fixedfilter") : null;
    this.vue = new Vue({
      created: function () {
        this.OhListStatus = OhListStatus;
        this.store = adapter;
        this.filtercriteria = filtercriteria;
        this.fixedfilter = fixedfilterAttr;
      },
      mixins: [ListModeMixin, EditorMixin, ListViewSelectionModeMixin, ...listmixins],
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
}

customElements.define('oh-vue-list', OhViewList);
