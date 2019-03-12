import { store } from '../js/app.js'; // Pre-bundled, external reference
import { OhListStatus } from './vue.js' // Pre-bundled, external reference
import { importModule } from "../_common/importModule";
import { UpdateAdapter } from './helper/updateAdapter';

/**
 * @category Data Components
 * @customelement oh-form-bind
 * @description This is a non-visible data binding component and serves as *Controller*
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
    this.createdBound = (e) => this.reInitDataFetch();
    this.connectedBound = (e) => this.connected(e.detail);
    this.connectingBound = (e) => this.connecting(e.detail);
    this.disconnectedBound = (e) => this.disconnected(e.detail);
  }
  async connectedCallback() {
    if (this.objectid) {
      const oid = this.objectid;
      delete this.objectid;
      this.objectid = oid;
    }
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
      if (this.modeladapter.events) {
        this.modeladapter.events.addEventListener("created", this.createdBound, { passive: true });
      }
      this.target.start(this.modeladapter, mixins);

      store.addEventListener("connectionEstablished", this.connectedBound, { passive: true });
      store.addEventListener("connecting", this.connectingBound, { passive: true });
      store.addEventListener("connectionLost", this.disconnectedBound, { passive: true });

      if (store.connected) this.connected(); else this.disconnected();
    } catch (e) {
      console.warn("form bind failed", e);
      this.target.error = e;
    };

  }
  disconnectedCallback() {
    store.removeEventListener("connectionEstablished", this.connectedBound, { passive: true });
    store.removeEventListener("connecting", this.connectingBound, { passive: true });
    store.removeEventListener("connectionLost", this.disconnectedBound, { passive: true });

    if (this.modeladapter) {
      if (this.modeladapter.events) this.modeladapter.events.removeEventListener("created", this.createdBound, { passive: true });
      this.modeladapter.dispose();
      delete this.modeladapter;
    }

    delete this.target;
    this.disconnected();
  }
  /**
   * A view must be able to tell the controller when a new "thing" has been created.
   * This is done by a "created" event on the "this.modeladapter.events" EventTarget.
   * 
   * This method will be called as a result. It will determine the objectid, by
   * inspecting the current "this.modeladapter.value" and depending on the store connection
   * state will initiate a call to "connected" or "disconnected".
   */
  reInitDataFetch() {
    this._objectid = (this.modeladapter.value ? this.modeladapter.value[this.modeladapter.STORE_ITEM_INDEX_PROP] : null);
    if (this._objectid)
      this.setAttribute("objectid", this._objectid)
    else
      this.removeAttribute("objectid");
    if (store.connected) this.connected(); else this.disconnected();
  }

  /**
   * The object id property can also be set / changed after the component has been loaded.
   * The corresponding attribute will be set/unset and depending on the store connection
   * state a call to "connected" or "disconnected" will follow.
   */
  set objectid(objectid) {
    console.log("SET PROPERTY", objectid);
    this._objectid = objectid;
    if (this._objectid)
      this.setAttribute("objectid", this._objectid)
    else
      this.removeAttribute("objectid");
    if (!this.modeladapter) return;
    if (store.connected) this.connected(); else this.disconnected();
  }

  get objectid() {
    console.log("GET OBJECT ID");
    return this._objectid;
  }

  async connected() {
    if (this.updateAdapter) this.updateAdapter.dispose();

    this._objectid = this.hasAttribute("objectid") ? this.getAttribute("objectid") : this._objectid;
    if (!this._objectid && this.hasAttribute("objectFromURL")) {
      this._objectid = new URL(window.location).searchParams.get(this.modeladapter.STORE_ITEM_INDEX_PROP);
    }

    this.updateAdapter = new UpdateAdapter(this.modeladapter, store, this._objectid);

    if (this._objectid !== undefined) {
      await this.modeladapter.get(null, this._objectid, null);
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
