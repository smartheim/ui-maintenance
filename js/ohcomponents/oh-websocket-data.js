import { importModule } from "../_common/importModule";

/**
 * This component tries to connect to a websocket address
 * 
 * Attributes:
 * - href // The destination websocket address, i.e. 'ws://localhost:8080'
 * 
 * Usage: <oh-doc-link href="some-link-to-markdown-or-html"><a href="#">Documentation</a></oh-doc-link>
 */
class OhWebsocketData extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['href'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name != "href") return;

    this.href = this.getAttribute("href");
    if (this.href) {
      if (this.socket) this.socket.close();
      this.socket = new WebSocket(this.href);
      this.socket.onclose = () => this.onclose();
      this.socket.onerror = (event) => this.onerror(event);
      this.socket.onmessage = (event) => this.onmessage(event.data, event.origin, event.lastEventId);
      this.socket.onopen = () => this.onopen();
    } else if (this.hasAttribute("simulation")) {
      const adapter = this.getAttribute("simulation");
      importModule('./js/' + adapter + '.js')
        .then((module) => this.startSimulation(module.SimulationGenerator))
        .catch(e => console.log("adapter bind failed", e));
    }
  }
  startSimulation(simClass) {
    if (this.sim) this.sim.dispose();
    this.sim = new simClass((data) => this.dispatchEvent(new CustomEvent("data", { detail: data })));
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