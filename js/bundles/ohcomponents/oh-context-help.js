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
 * - reload(): Reset cache and reload.
 * - load(): Load a specific url
 * 
 * Properties:
 * - contenturl: Content that temporarly overwrittes the current url 
 */
class OhContextHelp extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  connectedCallback() {
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  set contenturl(val) {
    this.innerHTML = this.loading;
    this.url = val;
    this.checkCacheAndLoad();
  }
  get contenturl() {
    return this.url;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.cachetime = this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : 600; // One day in minutes
    if (name == "url") {
      this.originalurl = this.getAttribute("url");
      this.url = this.originalurl;
    }
    if (this.initdone) this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.url) {
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = localStorage.getItem("timestamp_" + this.url);
    var cachedData = null;
    if (cacheTimestamp && parseInt(cacheTimestamp) + this.cachetime * 60 * 1000 > Date.now()) {
      cachedData = localStorage.getItem(this.url);
    }
    if (cachedData) {
      this.renderData(cachedData);
    } else {
      this.reload();
    }
  }
  home() {
    this.contenturl = this.originalurl;
  }
  reload() {
    this.load(this.url);
  }
  load(contenturl) {
    fetchWithTimeout(contenturl)
      .then(response => response.text())
      .then(str => contenturl.includes(".md") ? marked.parse(str) : str)
      .then(html => {
        localStorage.setItem(contenturl, html);
        localStorage.setItem("timestamp_" + contenturl, Date.now());
        this.renderData(html);
      }).catch(e => {
        this.innerHTML = this.error + e;
      })
  }
  renderData(data) {
    let additional = '<oh-doc-link class="link float-right" reload>Reload</oh-doc-link>';
    if (this.originalurl != this.url) {
      additional += '<p><oh-doc-link class="link" home>Page help</oh-doc-link> → <a class="disabled">Specific help</a></p>';
      this.setAttribute("nothome", "");
    } else {
      this.removeAttribute('nothome');
    }
    this.innerHTML = additional + data;
  }
}

customElements.define('oh-context-help', OhContextHelp);
