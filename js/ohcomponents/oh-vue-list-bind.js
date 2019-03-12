import { store } from '../js/app.js'; // Pre-bundled, external reference
import { importModule } from "../_common/importModule";
import { UpdateAdapter } from './helper/updateAdapter';
import { OhListStatus } from './vue.js' // Pre-bundled, external reference

/**
 * @category Data Components
 * @customelement oh-list-bind
 * @description This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the es6 adapter module.
 * 
 * The adapter module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 * - listmixins: A list of mixins applied to the list component
 * - ModelAdapter: The actual adapter
 * 
 * @attribute [for] The target dom element selector. If not set the next sibling will be used
 * @attribute [fixedfilter] A fixed filter expression.
 *   Either in the form of property:expression like "label:abc" or just the expression. In that case filtercriteria will be used.
 * @attribute [sort] A fixed sorting expression
 * @attribute [maxItems] A maximum items amount
 * @attribute [filtercriteria] A filter criteria, for example "label".
 * @attribute adapter The adapter to load. I.e. "modeladapter_lists/items"
 * 
 * @property {Object} [adapterParameters] Custom parameters for the ModelAdapter
 */
class OhListBind extends HTMLElement {
  constructor() {
    super();
    this.viewOptions = {};
    this.style.display = "none";
    this.connectedBound = (e) => this.connected(e.detail);
    this.connectingBound = (e) => this.connecting(e.detail);
    this.disconnectedBound = (e) => this.disconnected(e.detail);
  }
  connectedCallback() {
    // Lazy-load properties. A developer might attempt to set a property before its definition has been loaded. 
    if (this.hasOwnProperty("adapterparameters")) {
      let value = this.adapterparameters;
      delete this.adapterparameters;
      this._adapterParameters = value;
    }

    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target.ok) {
      this.target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    const maxItems = this.hasAttribute("maxItems") ? parseInt(this.getAttribute("maxItems")) : null;
    if (maxItems) {
      this.viewOptions.limit = maxItems;
    }

    this.fixedfilter = this.hasAttribute("fixedfilter") ? this.getAttribute("fixedfilter") : null;
    if (this.fixedfilter) {
      this.viewOptions.filter = this.fixedfilter;
    }

    if (this.hasAttribute("sort")) {
      this.viewOptions.sort = this.getAttribute("sort");
    }

    this.filtercriteria = this.hasAttribute("filtercriteria") ? this.getAttribute("filtercriteria") : null;

    this.filterbar = document.querySelector("ui-filter");
    if (this.filterbar) {
      this.filterBound = (event) => this.filter(event.detail.value.trim());
      this.increaseLimitBound = () => this.increaseLimit();
      this.filterbar.addEventListener("filter", this.filterBound);
      this.filterbar.addEventListener("showmore", this.increaseLimitBound);
    }


    const adapter = this.getAttribute("adapter");
    importModule('./js/' + adapter + '.js')
      .then(this.startList.bind(this)).catch(e => {
        console.warn("list bind failed", adapter, e);
        if (this.target.error) this.target.error = e;
      });
  }

  disconnectedCallback() {
    if (this.filterbar) {
      this.filterbar.removeEventListener("filter", this.filterBound);
      delete this.filterbar;
    }
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

  set adapterparameters(val) {
    console.log("adapterParameters", val, this.modeladapter);
    this._adapterParameters = val;
    if (this.modeladapter && this.modeladapter.parametersChanged)
      this.modeladapter.parametersChanged(this._adapterParameters, true, this.viewOptions);
  }

  async startList(module) {
    this.module = module;
    if (this.modeladapter) this.modeladapter.dispose();
    this.modeladapter = new module.ModelAdapter(this);
    this.target.start(this.modeladapter, module.listmixins, module.mixins);

    store.addEventListener("connectionEstablished", this.connectedBound, false);
    store.addEventListener("connecting", this.connectingBound, false);
    store.addEventListener("connectionLost", this.disconnectedBound, false);

    if (store.connected) this.connected(); else this.disconnected();
  }

  async connected() {
    if (this.updateAdapter) this.updateAdapter.dispose();

    this.objectid = this.hasAttribute("objectid") ? this.getAttribute("objectid") : this.objectid;
    if (!this.objectid && this.hasAttribute("objectFromURL")) {
      this.objectid = new URL(window.location).searchParams.get(this.modeladapter.STORE_ITEM_INDEX_PROP);
    }

    this.updateAdapter = new UpdateAdapter(this.modeladapter, store, this.objectid, this.viewOptions);

    if (this._adapterParameters && this.modeladapter.parametersChanged)
      this.modeladapter.parametersChanged(this._adapterParameters, false, this.viewOptions);

    await this.modeladapter.getall(this.viewOptions, this.objectid);
    this.target.vue.status = OhListStatus.READY;
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

  /**
   * 
   * @param {String} criteria The sorting criteria.
   *  Need to match with a database entries property. E.g. "label" or "category".
   * @param {Enumerator<String>} direction The sorting direction. Usually ↓ or ↑. If ↓↑ is set, the sorting will alternate.
   */
  async sort(criteria, direction = "↓↑") {
    if (!this.modeladapter) return;

    this.viewOptions.sort = criteria;
    if (direction == "↓↑") {
      this.viewOptions.direction = this.viewOptions.direction == "↓" ? "↑" : "↓";
    } else
      this.viewOptions.direction = direction;
    await this.modeladapter.getall(this.viewOptions, this.objectid);
  }

  async increaseLimit() {
    if (!this.modeladapter) return;
    if (!this.viewOptions.limit) return;

    this.viewOptions.limit += 50;
    await this.modeladapter.getall(this.viewOptions, this.objectid);
  }

  filter(filter) {
    if (!this.modeladapter || !this.filtercriteria) return;

    if (!filter.includes(":"))
      filter = this.filtercriteria + ":" + filter;

    if (this.filterThrottleTimer) {
      clearTimeout(this.filterThrottleTimer);
    }
    this.filterThrottleTimer = setTimeout(async () => {
      delete this.filterThrottleTimer;

      if (this.fixedfilter) {
        filter += "&&" + this.fixedfilter;
      }

      this.viewOptions.filter = filter;
      await this.modeladapter.getall(this.viewOptions, this.objectid);
    }, 120);
  }
}

customElements.define('oh-list-bind', OhListBind);
