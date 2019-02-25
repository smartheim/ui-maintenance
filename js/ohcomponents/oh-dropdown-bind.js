import { store } from '../js/app.js'; // Pre-bundled, external reference
import { importModule } from "../_common/importModule";
/**
 * @category Data Components
 * @customelement oh-dropdown-bind
 * @description This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "adapter" es6 module.
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 */
class OhDropdownBind extends HTMLElement {
  constructor() {
    super();
    this.connectedBound = (e) => this.connected(e.detail);
    this.connectingBound = (e) => this.connecting(e.detail);
    this.disconnectedBound = (e) => this.disconnected(e.detail);
    this.listChangedBound = (e) => this.listChanged(e.detail);
  }
  connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("OhDropdownBind: Could not find target!");
      return;
    }

    const adapter = this.getAttribute("adapter");
    importModule('./js/' + adapter + '.js')
      .then(this.startList.bind(this)).catch(e => {
        console.log("list bind failed", e);
        this.target.error = e;
      });
  }
  disconnectedCallback() {
    store.removeEventListener("connectionEstablished", this.connectedBound, false);
    store.removeEventListener("connecting", this.connectingBound, false);
    store.removeEventListener("connectionLost", this.disconnectedBound, false);
    store.removeEventListener("storeChanged", this.listChangedBound, false);
    if (!this.modeladapter) {
      this.modeladapter.dispose();
      delete this.modeladapter;
    }
  }
  async startList(module) {
    if (this.modeladapter) this.modeladapter.dispose();
    this.modeladapter = new module.ModelAdapter();
    store.addEventListener("connectionEstablished", this.connectedBound, false);
    store.addEventListener("connecting", this.connectingBound, false);
    store.addEventListener("connectionLost", this.disconnectedBound, false);
    store.addEventListener("storeChanged", this.listChangedBound, false);

    if (store.connected) this.connected(); else this.disconnected();
  }

  async connected() {
    let list = await this.modeladapter.getall();
    this.target.options = list;
  }

  connecting() {
    this.target.options = [];
    this.target.label = "Connecting...";
  }
  disconnected() {
    this.target.options = [];
    this.target.label = "Not connected!";
  }

  listChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;
    this.target.options = e.value;
  }
}

customElements.define('oh-dropdown-bind', OhDropdownBind);
