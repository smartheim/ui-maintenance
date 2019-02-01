import { store } from './app.js';
/**
 * This is a tandem component for oh-context-help and alike.
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

        var items = node.querySelectorAll(".hostname");
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