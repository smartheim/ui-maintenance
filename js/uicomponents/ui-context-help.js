import { fetchWithTimeout } from '../_common/fetch';
import { Marked } from "../_marked";

const marked = new Marked();

/**
* @category Web Components
* @customelement ui-context-help
* @description This element renders the context help on the right pane.
* @attribute url The url [https://api.github.com/repos/openhab/openhab2-addons/issues]
* @attribute [loading] The loading html text [Loading...]
* @attribute [error] The error html text [Error has happened]
* @attribute [cachetime] The cache time in minutes [600]
* @attribute [nothome] read-only. Will be set, when the url is overwritten by "content"
* @property {String} contenturl Content url that temporarly overwrittes the current url 
* @example <caption>Example</caption>
* <ui-context-help></ui-context-help>
*/
class OhContextHelp extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  connectedCallback() {
    if (!this.style.display || this.style.display.length == 0) this.style.display = "block";
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
  /**
   * Reloads data
   */
  checkCacheAndLoad() {
    if (!this.url) {
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }
    if (cachedData) {
      this.renderData(cachedData);
    }
    else {
      this.reload();
    }
  }
  /**
   * Goes back to the set "url" that might have been temporarily overwritten by {@link #load}.
   */
  home() {
    this.contenturl = this.originalurl;
  }
  /**
   * Reset cache and reload.
   */
  reload() {
    this.load(this.url);
  }
  /**
   * Load a specific url
   * @property {String} contenturl Content that temporarly overwrittes the current url 
   */
  load(contenturl) {
    fetchWithTimeout(contenturl).then(response => response.text()).then(str => contenturl.includes(".md") ? marked.parse(str) : str).then(html => {
      localStorage.setItem(contenturl, html);
      localStorage.setItem("timestamp_" + contenturl, Date.now());
      this.renderData(html);
    }
    ).catch(e => {
      this.innerHTML = this.error + e + " " + this.url;
    }
    )
  }
  renderData(data) {
    let additional = '<oh-doc-link class="link float-right" reload>Reload</oh-doc-link>';
    if (this.originalurl != this.url) {
      additional += '<p><oh-doc-link class="link" home>Page help</oh-doc-link> → <a class="disabled">Specific help</a></p>';
      this.setAttribute("nothome",
        "");
    }
    else {
      this.removeAttribute('nothome');
    }
    this.innerHTML = additional + data;
  }
}

customElements.define('ui-context-help', OhContextHelp);