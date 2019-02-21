import { store } from '../app.js'; // Pre-bundled, external reference
import { importModule } from "../../../common/importModule";
import { UpdateAdapter } from './updateAdapter';
import { OhListStatus } from './oh-vue-list-status'

/**
 * This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "adapter" es6 module.
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 * - schema: An optional json-schema for the text-editor
 */
class OhVueFormBind extends HTMLElement {
  constructor() {
    super();
    this.connectedBound = (e) => this.connected(e.detail);
    this.connectingBound = (e) => this.connecting(e.detail);
    this.disconnectedBound = (e) => this.disconnected(e.detail);
  }
  async connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target.ok) {
      this.target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    if (this.modeladapter) this.modeladapter.dispose();

    const mixin = this.getAttribute("mixin");
    try {
      this.module = await importModule('./js/' + this.getAttribute("adapter") + '.js');
      this.modeladapter = new this.module.ModelAdapter();
      let mixins = this.module.mixins.slice(0);
      if (mixin) {
        const moreMixins = await importModule('./js/' + mixin + '.js');
        mixins = mixins.concat(moreMixins.mixins);
      }
      this.target.start(this.modeladapter, mixins);

      store.addEventListener("connectionEstablished", this.connectedBound, false);
      store.addEventListener("connecting", this.connectingBound, false);
      store.addEventListener("connectionLost", this.disconnectedBound, false);

      if (store.connected) this.connected(); else this.disconnected();
    } catch (e) {
      console.warn("form bind failed", e);
      this.target.error = e;
    };

  }
  disconnectedCallback() {
    store.removeEventListener("connectionEstablished", this.connectedBound, false);
    store.removeEventListener("connecting", this.connectingBound, false);
    store.removeEventListener("connectionLost", this.disconnectedBound, false);

    if (this.modeladapter) {
      this.modeladapter.dispose();
      delete this.modeladapter;
    }

    delete this.target;
    this.disconnected();
  }
  /**
   * A view must be able to tell the controller when a new "thing" has been created.
   * @param {String} newId 
   */
  idAssigned(newId) {
    this.objectid = newId;
    this.setAttribute("objectid", this.objectid);
    if (store.connected) this.connected(); else this.disconnected();
  }

  async connected() {
    if (this.updateAdapter) this.updateAdapter.dispose();

    this.objectid = this.hasAttribute("objectid") ? this.getAttribute("objectid") : this.objectid;
    if (!this.objectid && this.hasAttribute("objectFromURL")) {
      this.objectid = new URL(window.location).searchParams.get(this.modeladapter.STORE_ITEM_INDEX_PROP);
    }

    this.updateAdapter = new UpdateAdapter(this.modeladapter, store, this.objectid);

    if (this.objectid !== undefined) {
      await this.modeladapter.get(this.objectid);
      this.target.vue.status = OhListStatus.READY;
    } else if (!this.hasAttribute("allowNew")) {
      this.error = "No id set and no attribute 'allowNew'";
    }
  }
  connecting() {
    this.target.connectionState(true, store.host);
  }
  disconnected() {
    if (!this.updateAdapter) return;
    this.updateAdapter.dispose();
    delete this.updateAdapter;
    if (this.target) this.target.connectionState(false, store.connectionErrorMessage);
  }
  set context(data) {
    if (this.target && this.target.updateContext) this.target.updateContext(data);
  }
}

customElements.define('oh-form-bind', OhVueFormBind);
