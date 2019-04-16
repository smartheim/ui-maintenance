import { store } from '../js/app.js';
import { OhListStatus } from './vue.js';

/**
 * @category Data Components
 * @customelement oh-login-status-link
 * @description This is a tandem component for ui-context-help and alike.
 * 
 * The target component is expected to have this API interface:
 * .reset() // Optional: For reloading content
 * .checkCacheAndLoad() // Optional: For displaying the original, cached content if that was temporarly overwritten
 * .contenturl OR .url // property for setting a new url
 * .contextdata // If this is existing it will be set to null before setting the url
 * 
 * Attributes:
 * - href // The destination url
 * - toggle // If set will toggle a body class "showcontext"
 * - reload // If set will call target.reset() if no "href" is also set
 * - home // If set will call target.checkCacheAndLoad() if no "href" is also set
 * 
 * Usage: <oh-doc-link href="some-link-to-markdown-or-html"><a href="#">Documentation</a></oh-doc-link>
 */
class OhLoginStatusLink extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>.hidden{display:none;}</style><slot class="hidden" name="connected"></slot><slot class="hidden" name="disconnected"></slot>`;
    this.connectionChangedBound = () => this.connectionChanged();
  }
  connectedCallback() {
    this.items = [];
    const slots = this.shadowRoot.querySelectorAll('slot');
    for (let slot of slots) {
      for (let node of slot.assignedNodes()) {
        const items = node.querySelectorAll(".hostname");
        for (let item of items) this.items.push(item);
      }
    }
    store.addEventListener("connecting", this.connectionChangedBound, false);
    store.addEventListener("connectionEstablished", this.connectionChangedBound, false);
    store.addEventListener("connectionLost", this.connectionChangedBound, false);
    this.connectionChangedBound();
  }
  disconnectedCallback() {
    store.removeEventListener("connecting", this.connectionChangedBound, false);
    store.removeEventListener("connectionEstablished", this.connectionChangedBound, false);
    store.removeEventListener("connectionLost", this.connectionChangedBound, false);
  }
  connectionChanged() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.changeState(), 500);
  }
  changeState() {
    this.timer = null;
    for (let item of this.items) item.innerHTML = store.host;
    if (store.connected) {
      this.shadowRoot.querySelector('slot[name="disconnected"]').classList.add("hidden");
      this.shadowRoot.querySelector('slot[name="connected"]').classList.remove("hidden");
    } else {
      this.shadowRoot.querySelector('slot[name="connected"]').classList.add("hidden");
      this.shadowRoot.querySelector('slot[name="disconnected"]').classList.remove("hidden");
    }
    this.classList.remove("invisible");
  }
}

customElements.define('oh-login-status-link', OhLoginStatusLink);

class FetchError extends Error {
  constructor(message, status) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.status = status;
  }
  networkErrorMessage() {
    return this.message + " (" + this.status + ")";
  }
  toString() {
    return this.message + " (" + this.status + ")";
  }
}

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: signal, validateHttpsCertificates: false, muteHttpExceptions: true }).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });
  if (!response.ok) {
    const body = await response.text();
    throw new FetchError(response.statusText + " " + body, response.status);
  }
  return response;
}

/**
 * @category Data Components
 * @customelement oh-script-snippets
 * @description This element renders a list of links (ul->li->a)
 * with available script snippets from, that it fetches
 * from "scriptsnippets/index.json". That file is expected
 * to be a json list with {name,file} entries.
 * 
 * A click on a link will dispatch a "loadscript" event
 * with these "details": {filename}.
 */
class OhScriptSnippets extends HTMLElement {
  constructor() {
    super();
  }
  async connectedCallback() {
    while (this.firstChild) { this.firstChild.remove(); }

    const ul = document.createElement('ul');
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : null;
    this.language = this.hasAttribute("language") ? this.getAttribute("language") : "javascript";

    try {
      const json = await fetchWithTimeout("scriptsnippets/" + this.language + "/index.json").then(response => response.json());
      for (const entry of json) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.innerHTML = entry.name;
        a.href = "#";
        a.addEventListener("click", async (e) => {
          e.preventDefault();
          let targetEl = null;
          if (this.target) targetEl = document.getElementById(this.target);
          if (!targetEl) return;
          targetEl.addAtCursorPosition(await fetchWithTimeout("scriptsnippets/" + this.language + "/" + entry.file).then(d => d.text()));
        });
        li.appendChild(a);
        ul.appendChild(li);
      }
    } catch (e) {
      ul.innerText = '';
      const li = document.createElement("li");
      li.innerText = e;
      ul.appendChild(li);
    }

    this.appendChild(ul);
  }
}

customElements.define('oh-script-snippets', OhScriptSnippets);

/**
 * @category Data Components
 * @customelement oh-doc-link
 * @description This is a tandem component for ui-context-help and alike.
 * 
 * The target component is expected to have this API interface:
 * .reload() // Optional: For reloading content
 * .checkCacheAndLoad() // Optional: For displaying the original, cached content if that was temporarly overwritten
 * .contenturl OR .url // property for setting a new url
 * .contextdata // If this is existing it will be set to null before setting the url
 * 
 * Attributes:
 * - href // The destination url
 * - toggle // If set will toggle a body class "showcontext"
 * - reload // If set will call target.reload() if no "href" is also set
 * - home // If set will call target.checkCacheAndLoad() if no "href" is also set
 * 
 * Usage: <oh-doc-link href="some-link-to-markdown-or-html"><a href="#">Documentation</a></oh-doc-link>
 */
class OhDocLink extends HTMLElement {
  constructor() {
    super();
    let tmpl = document.createElement('template');
    tmpl.innerHTML = `<slot></slot>`;
    let shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(tmpl.content.cloneNode(true));
    this.slotListenerBound = () => this.slotListener();
    this.context = null;
  }
  static get observedAttributes() {
    return ['href'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.href = this.getAttribute("href");
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : "ui-context-help";
    this.toggle = this.hasAttribute("toggle");
    this.reload = this.hasAttribute("reload");
    this.show = this.hasAttribute("show");
    this.home = this.hasAttribute("home");
  }
  connectedCallback() {
    this.setAttribute("tabindex", "0");
    this.attributeChangedCallback();
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', this.slotListenerBound, { passive: true });
  }
  disconnectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.removeEventListener('slotchange', this.slotListenerBound, { passive: true });
  }

  /**
   * As soon as the <slot> got a child, this is called.
   * Add the on-click lister to all child nodes.
   */
  slotListener() {
    if (!this.shadowRoot) return;
    const slot = this.shadowRoot.querySelector('slot');
    const nodes = slot.assignedNodes();
    if (!nodes.length) return;
    for (const node of nodes) {
      node.onclick = (e) => this.clickListener(e);
      node.onkeyup = (e) => { if (e.keyCode === 13) this.clickListener(e); };
    }
    this.onclick = (e) => this.clickListener(e);
    this.onkeyup = (e) => { if (e.keyCode === 13) this.clickListener(e); };
  }

  /**
   * Add "showcontext" class to body and tell the target
   * web component the new url and context data.
   */
  clickListener(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.toggle)
      document.querySelector('body').classList.toggle('showcontext');
    else if (this.show)
      document.querySelector('body').classList.add('showcontext');
    const el = document.querySelector(this.target);
    if (!el) {
      console.warn("Did not find target element: ", this.target);
      return;
    }

    if (this.href) {
      el.contextdata = this.context;
      if (el.contenturl)
        el.contenturl = this.href;
      else
        el.url = this.href;
    } else if (this.home) {
      el.home();
    } else if (this.reload) {
      el.reload();
    }
  }
}

customElements.define('oh-doc-link', OhDocLink);

/**
 * @category Data Components
 * @customelement oh-change-filter
 * @description This is a tandem component for ui-filterbar and ui-vue-list-bind
 * 
 */
class OhChangeFilter extends HTMLElement {
  constructor() {
    super();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : null;
    this.filter = this.hasAttribute("filter") ? this.getAttribute("filter") : null;
    this.sort = this.hasAttribute("sort") ? this.getAttribute("sort") : null;
    this.direction = this.hasAttribute("direction") ? this.getAttribute("direction") : null;
  }
  connectedCallback() {
    this.classList.add("link");
    this.attributeChangedCallback();
    this.onclick = (e) => this.clickListener(e);
  }
  clickListener(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = document.querySelector(this.target);
    if (!el) {
      console.warn("Did not find target element: ", this.target);
      return;
    }

    if (this.filter) el.setAttribute("value", this.filter);
    if (this.sort) el.sort(this.sort, this.direction);
  }
}

customElements.define('oh-change-filter', OhChangeFilter);

/**
 * Firefox is the last evergreen browser that does not support dynamic import yet.
 * It will with Firefox 67 (May 2019). Please remove this polyfill after
 * the release.
 */
async function importModule(url) {
  const vector = "import" + url.replace(/\./g, "").replace(/\//g, "_");
  if (document.getElementById("id_" + vector)) {
    return window[vector];
  }

  const loader = `
  import * as m from "${url}";
  window["${vector}"] = m;
  document.getElementById("id_${vector}").dispatchEvent(new CustomEvent("loaded",{detail:m}))
  `; // export Module

  const script = document.createElement("script");
  script.type = "module";
  script.id = "id_" + vector;
  script.async = 'async';
  script.textContent = loader;

  const promise = new Promise((resolve, reject) => {
    script.onerror = (e) => {
      console.warn(`Failed to import: ${url}`, e);
      reject(new Error(`Failed to import: ${url}`));
    };
    script.addEventListener("loaded", (event) => {
      resolve(event.detail);
    }, { passive: true });
    document.head.appendChild(script);
  });
  window[vector] = promise;
  return promise;
}

/**
 * @category Data Components
 * @customelement oh-websocket-data
 * @description Creates and maintains a websocket connection and provides the data via an event
 * @attribute href The connection protocol, host and port like ws://127.0.0.1:8080
 * @attribute [simulation] A simulation mixin that provides an exported "SimulationGenerator" class
 * @attribute [run] If set, the connection is established immediately
 * @property {Boolean} run A property to control the connection state.
 *   Set to false to disconnect and true to connect.
 * 
 * @example <caption>A websocket connection to 127.0.0.1 on port 8080 and immediately started</caption>
 * <oh-websocket-data href="ws://127.0.0.1:8080" run></oh-websocket-data>
 */
class OhWebsocketData extends HTMLElement {
  constructor() {
    super();
    this._active = false;
  }
  static get observedAttributes() {
    return ['href', 'run'];
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    this._active = this.hasAttribute("run");
    if (name != "href") return;
    this.href = this.getAttribute("href");

    if (this.hasAttribute("simulation")) {
      const adapter = this.getAttribute("simulation");
      let module = await importModule('./js/' + adapter + '.js');
      this.SimulationGenerator = module.SimulationGenerator;
      if (this._active) this.run = true;
    } else if (this.href) {
      if (this._active) this.run = true;
    }
  }
  get run() {
    return this._active;
  }
  set run(val) {
    this._active = val;
    if (this._active)
      this.setAttribute("run", "");
    else
      this.removeAttribute("run");

    // Disable
    if (!this._active) {
      if (this.socket) this.socket.close();
      delete this.socket;
      if (this.sim) this.sim.dispose();
      delete this.sim;
      return;
    }

    // Enable
    if (this.href) {
      if (this.socket) this.socket.close();
      this.socket = new WebSocket(this.href);
      this.socket.onclose = () => this.onclose();
      this.socket.onerror = (event) => this.onerror(event);
      this.socket.onmessage = (event) => this.onmessage(event.data, event.origin, event.lastEventId);
      this.socket.onopen = () => this.onopen();
    } else if (this.hasAttribute("simulation")) {
      if (this.sim) this.sim.dispose();
      this.sim = new this.SimulationGenerator((data) => this.dispatchEvent(new CustomEvent("data", { detail: data })));
    }
  }
  onclose() {
    console.log("OhWebsocketData. Websocket closed", this.id);
  }
  onerror(event) {
    console.log("OhWebsocketData. Websocket error", this.id, event);
  }
  onmessage(data, origin, lastEventId) {
    console.debug("Received websocket message", this.id, data, origin);
    this.dispatchEvent(new CustomEvent("data", { detail: data }));
  }
  onopen() {
    console.debug("OhWebsocketData. Websocket opened", this.id);
  }

  connectedCallback() {
    this.attributeChangedCallback("href");
  }
  disconnectedCallback() {
    if (this.socket) this.socket.close();
    delete this.socket;
    if (this.sim) this.sim.dispose();
    delete this.sim;
  }
}

customElements.define('oh-websocket-data', OhWebsocketData);

/**
 * Data event
 *
 * @category Data Components
 * @event oh-websocket-data#data
 * @type {Object|Array}
 */

/**
 * @category Data Components
 * @customelement oh-tutorial-starter
 * @description Extracts a value from the URL query string ("queryParameter") and adds it as an attribute
 * to the referenced destination via element ID given by "for" or by using the next sibling element.
 */
class OhTutorialStarter extends HTMLElement {
  constructor() {
    super();
    this.clickBound = () => this.clicked();
  }
  connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("Failed to find target", forid);
      return;
    }
    this.target.addEventListener("click", this.clickBound, { passive: true });
  }
  disconnectedCallback() {
    if (this.target) this.target.removeEventListener("click", this.clickBound, { passive: true });
  }
  async clicked() {
    let m = await importModule('./js/tutorial.js');
    m.startTutorial(this.getAttribute("subject"));
  }
}

customElements.define('oh-tutorial-starter', OhTutorialStarter);

/**
 * @category Data Components
 * @customelement oh-event-bind
 * @description Extracts a value from an event ("eventName") of a "destination" and adds it as an attribute ("attribute")
 * to the referenced target via element ID given by "for" or by using the next sibling element.
 * 
 * Valid attributes:
 * - from: The event sender. Optional. If not set, will be document
 * - eventName: The eventname to listen to.
 * - for: The target/recepient
 * - attribute: The attribute name that will be set on the target.
 * - setcontent: Boolean. Instead of setting an attribute, the targets content is set.
 */
class OhEventBind extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("Failed to find target", forid);
      return;
    }

    if (this.hasAttribute("from")) {
      this.from = this.getAttribute("from");
      if (!document.querySelector(this.from)) this.from = null;
    }
    if (!this.from) this.from = document;

    this.eventName = this.getAttribute("eventName");
    this.boundMethod = (e) => this.eventMethod(e.detail);
    this.from.addEventListener(this.eventName, this.boundMethod);
  }
  disconnectedCallback() {
    if (this.eventName) this.from.removeEventListener(this.eventName, this.boundMethod);
  }
  eventMethod(e) {
    if (this.hasAttribute("setcontent")) {
      this.target.innerHTML = e;
    } else {
      const attribute = this.getAttribute("attribute");
      this.target.setAttribute(attribute, e);
    }
  }
}

customElements.define('oh-event-bind', OhEventBind);

/**
 * @category Data Components
 * @customelement oh-prop-bind
 * @description Extracts a value from the URL query string ("queryParameter") or a propery value of a source element
 * and adds it to the referenced destination. It either adds it as an attribute or a property or to the content area
 * of the referenced destination. The destination is given via element ID by "for" or by the next sibling element will be used.
 * @attribute [for] The destination dom element [#exampleElement]
 * @attribute [contextfrom] A source dom element
 * @attribute [sourceproperty] A property that will be read from the source dom element and used. If not set, "contextdata" will be used.
 * @attribute [queryParameter] The URL query part that should be used as source
 * @attribute [regex] A regular expression to extract something out of the query
 * @attribute [setcontent] If this is set the destination inner html content will be replaced.
 * @attribute [attribute] The destination attribute.
 * @attribute [property] The destination property.
 */
class OhPropBind extends HTMLElement {
  constructor() {
    super();

  }

  connectedCallback() {
    this.style.display = "none";

    let data;

    if (this.hasAttribute("contextfrom")) {
      const targetNode = document.querySelector(this.getAttribute("contextfrom"));
      const sourceProperty = this.getAttribute("sourceproperty") || "contextdata";
      data = targetNode[sourceProperty];
    } else if (this.hasAttribute("queryParameter")) {
      const queryParameter = this.getAttribute("queryParameter");
      const regex = this.getAttribute("regex");
      data = new URL(window.location).searchParams.get(queryParameter);
      if (regex && data) {
        data = data.match(regex)[1];
      }
    }

    if (!data) {
      //throw new Error("No contextfrom or queryParameter set");
      return;
    }

    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("Failed to find target", forid);
      return;
    }
    if (this.hasAttribute("setcontent")) {
      this.target.innerHTML = data;
    }
    if (this.hasAttribute("attribute")) {
      const attribute = this.getAttribute("attribute");
      if (this.hasAttribute("unwrap"))
        this.target.setAttribute(attribute, data[this.getAttribute("unwrap")]);
      else
        this.target.setAttribute(attribute, data);
    }
    if (this.hasAttribute("property")) {
      const property = this.getAttribute("property");
      if (this.hasAttribute("unwrap"))
        this.target[property] = data[this.getAttribute("unwrap")];
      else
        this.target[property] = data;
    }
  }


}

customElements.define('oh-prop-bind', OhPropBind);

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
    await this.modeladapter.getall();
    this.target.options = this.modeladapter.items;
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

/**
 * @category Data Components
 * @memberof module:ohcomponents
 * @customelement oh-nav-auto-link
 * @description Update the "active" class for sibling child links, depending on the current page url.

 * @example <caption>Usage</caption>
 * <nav>
 * <oh-nav-auto-link></oh-nav-auto-link>
    <div><a id="navmaintenance" href="maintenance.html">Maintenance</a></div>
    <div><a id="navbindings" href="bindings.html">Add-ons</a></div>
 * </nav>
 */
class OhNavAutoLink extends HTMLElement {
  constructor() {
    super();
    this.pageChangedBound = () => this.checkLinks();
    document.addEventListener("DOMContentLoaded", this.pageChangedBound);
  }
  disconnectedCallback() {
    document.removeEventListener("DOMContentLoaded", this.pageChangedBound);
  }
  connectedCallback() {
    this.style.display = "none";
    this.checkLinks();
  }
  /**
   * Checks the sibling links if they need the "active" class (depending on the 'href' attribute).
   * This method is automatically called on every "DOMContentLoaded" event.
   */
  checkLinks() {
    let parentlink = document.querySelector('link[rel="parent"]');
    if (parentlink) parentlink = parentlink.href;

    const elems = this.parentNode.children;
    for (let elem of elems) {
      if (elem == this) continue;
      const link = elem.children[0];
      if (!link.href) continue;
      const classlist = link.classList;
      classlist.remove("active");
      classlist.remove("semiactive");
      const url = new URL(link.href);
      if (url.pathname == window.location.pathname && url.search == window.location.search)
        classlist.add("active");
      else if (link.href == parentlink)
        classlist.add("semiactive");
    }
  }
}

customElements.define('oh-nav-auto-link', OhNavAutoLink);

/**
 * @category Data Components
 * @customelement oh-vue-bind
 * @description This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "adapter" es6 module.
 * 
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 * - components: An optional json-schema for the text-editor
 */
class OhVueBind extends HTMLElement {
  constructor() {
    super();
    this.style.display = "none";
  }
  connectedCallback() {
    const forid = this.getAttribute("for");
    let target = document.getElementById(forid);
    if (!target) {
      target = this.nextElementSibling;
    }
    if (!target.ok) {
      target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    this.target = target;

    let contextdata = {};
    if (this.hasAttribute("contextfrom") && this.hasAttribute("sourceproperty")) {
      const targetNode = document.querySelector(this.getAttribute("contextfrom"));
      const sourceProperty = this.getAttribute("sourceproperty") || "contextdata";
      contextdata = targetNode[sourceProperty];
    }

    if (this.hasAttribute("adapter")) {
      const adapter = this.getAttribute("adapter");
      importModule('./js/' + adapter + '.js')
        .then((module) => {
          target.start(module.mixins, contextdata);
        })
        .catch(e => console.log("adapter bind failed", e));
    } else {
      target.start([], contextdata);
    }
  }
  disconnectedCallback() {
  }
  set context(data) {
    if (this.target) this.target.updateContext(data);
  }
}

customElements.define('oh-vue-bind', OhVueBind);

/**
 * @category Data Components
 * @description Takes a list adapter, the database store and optionally an objectid.
 * 
 * Whenever the store changes, the list adapter content will be updated,
 * which in turn will update the views.
 */
class UpdateAdapter {
  constructor(modeladapter, store, objectid = null, viewOptions = null) {
    this.modeladapter = modeladapter;
    this.store = store;
    this.objectid = objectid;
    this.viewOptions = viewOptions;
    this.listChangedBound = (e) => this.listChanged(e.detail);
    this.listEntryChangedBound = (e) => this.listEntryChanged(e.detail);
    this.listEntryRemovedBound = (e) => this.listEntryRemoved(e.detail);
    this.listEntryAddedBound = (e) => this.listEntryAdded(e.detail);

    store.addEventListener("storeChanged", this.listChangedBound, false);
    store.addEventListener("storeItemChanged", this.listEntryChangedBound, false);
    store.addEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
    store.addEventListener("storeItemAdded", this.listEntryAddedBound, false);
  }
  dispose() {
    this.store.removeEventListener("storeChanged", this.listChangedBound, false);
    this.store.removeEventListener("storeItemChanged", this.listEntryChangedBound, false);
    this.store.removeEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
    this.store.removeEventListener("storeItemAdded", this.listEntryAddedBound, false);
    this.store = null;
    this.objectid = null;
    this.modeladapter = null;
    this.viewOptions = null;
  }

  /**
  * The entire list changed. Request a model refresh.
  */
  listChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;
    this.modeladapter.get(e.storename, this.objectid, this.viewOptions);
  }

  listEntryChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      if (!id) {
        console.warn(`listEntryChanged: Expected key property "${this.modeladapter.STORE_ITEM_INDEX_PROP} for ${e.storename}`, e.value);
        return;
      }
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        let entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          value.splice(i, 1, e.value);
          return;
        }
      }
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryChanged->update view", e.storename, e.value);
        setval(adapterField, this, e.value);
      }
    }
  }

  listEntryRemoved(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        const entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          console.debug("listEntryRemoved->update view", e.storename, e.value);
          value.splice(i, 1);
          return;
        }
      }
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryRemoved->update view", e.storename, e.value);
        setval(adapterField, this, {});
      }
    }
  }

  listEntryAdded(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        const entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          console.debug("listEntryChanged->update view", e.storename, e.value);
          value.splice(i, 1, e.value);
          return;
        }
      }
      // Not found in list -> add entry
      console.debug("listEntryChanged->add to view", e.storename, e.value);
      value.push(e.value);
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryAdded->update view", e.storename, e.value);
        setval(adapterField, this, e.value);
      }
    }
  }
}

function val(adapterField, u) {
  return u.modeladapter[adapterField];
}

function setval(adapterField, u, newval) {
  u.modeladapter[adapterField] = newval;
}

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
    }
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
      this.setAttribute("objectid", this._objectid);
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
      this.setAttribute("objectid", this._objectid);
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

/**
 * Data components module.
 * 
 * @category Data Components
 * @module ohcomponents
 */
