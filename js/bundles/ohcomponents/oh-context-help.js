import { fetchWithTimeout } from '../../common/fetch';
import { Marked } from "./marked/index.mjs";
const marked = new Marked();

/**
 * This element renders a list the context help on the right pane.
 * 
 * Attributes:
 * - "url": For example "https://api.github.com/repos/openhab/openhab2-addons/issues".
 * - "loading": The loading html text
 * - "error": The error html text
 * - "nothome": read-only. Will be set, when the url is overwritten by "content"
 * 
 * Methods:
 * - checkCacheAndLoad(): Reloads data.
 * - reset(): Reset cache and reload.
 * - load(): Load a specific url
 * 
 * Properties:
 * - contenturl: Content that temporarly overwrittes the current url 
 */
class OhContextHelp extends HTMLElement {
  constructor() {
    super();
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  connectedCallback() {
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  set contenturl(val) {
    this.innerHTML = this.loading;
    this.checkCacheAndLoad(val);
  }
  get contenturl() {
    return this.url;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.cachetime = this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : 1440; // One day in minutes
    this.url = this.getAttribute("url");
    if (this.initdone) this.checkCacheAndLoad(this.url);
  }
  checkCacheAndLoad(contenturl = null) {
    if (!contenturl) contenturl = this.url;
    if (!contenturl) {
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = localStorage.getItem("timestamp_" + contenturl);
    var cachedData = null;
    if (cacheTimestamp && parseInt(cacheTimestamp) + this.cachetime * 60 * 1000 > Date.now()) {
      cachedData = localStorage.getItem(contenturl);
    }
    if (cachedData) {
      this.renderData(cachedData, contenturl);
    } else {
      this.reset(contenturl);
    }
  }
  reset(contenturl = null) {
    if (!contenturl) contenturl = this.url;
    localStorage.removeItem("timestamp_" + contenturl);
    this.innerHTML = this.loading;
    this.load(contenturl);
  }
  load(contenturl) {
    fetchWithTimeout(contenturl)
      .then(response => response.text())
      .then(str => contenturl.includes(".md") ? marked.parse(str) : str)
      .then(html => {
        localStorage.setItem(contenturl, html);
        localStorage.setItem("timestamp_" + contenturl, Date.now());
        this.renderData(html, contenturl);
      }).catch(e => {
        this.innerHTML = this.error + e;
      })
  }
  renderData(data, contenturl) {
    this.innerHTML = data;
    if (contenturl != this.url) {
      // this.dispatchEvent(new CustomEvent("contextchanged", { detail: data }));
      this.setAttribute("nothome", "");
    } else {
      this.removeAttribute('nothome');
    }
  }
}

customElements.define('oh-context-help', OhContextHelp);
