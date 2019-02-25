import { importModule } from "../_common/importModule";

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
