import { fetchWithTimeout } from '../_common/fetch';

/**
 * @category Web Components
 * @customelement ui-community-topics
 * @description This element renders a list of topics threads from the given forum url.
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
class OhCommunityTopics extends HTMLElement {
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
    this.limit = this.hasAttribute("limit") ? parseInt(this.getAttribute("limit")) : null;
    this.topics = this.hasAttribute("topics") ? this.getAttribute("topics") : null;
    this.order = this.hasAttribute("order") ? this.getAttribute("order") : "created";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  set contenturl(val) {
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;
    this.checkCacheAndLoad(val);
  }
  get contenturl() {
    if (!this.topics) return null;
    if (this.order)
      return this.url + "/" + this.topics + ".json?order=" + this.order;
    else
      return this.url + "/" + this.topics + ".json";
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.cachetime = this.cachetime = (this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : null) || 1440; // One day in minutes
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : "https://cors-anywhere.herokuapp.com/https://community.openhab.org";
    if (this.initdone) this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.contenturl) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.contenturl)) || 0;
    this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(cacheTimestamp).toLocaleString()}`;
    var cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.contenturl);
    }
    if (cachedData) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = cachedData;
    } else {
      this.reload();
    }
  }
  reload() {
    if (!this.contenturl) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    localStorage.removeItem("timestamp_" + this.contenturl);
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;
    this.load();
  }
  load() {
    const url = this.contenturl;
    fetchWithTimeout(url)
      .then(response => response.json())
      .then(jsonData => {
        var d = "<ul>";
        var counter = 0;
        for (var topic of jsonData.topic_list.topics) {
          const date = new Date(topic.created_at).toLocaleDateString();
          d += "<li><a target='_blank' href='https://community.openhab.org/t/" + topic.slug + "/" + topic.id + "'>" + topic.title + "</a> <small>" + date + "</small></li>"
          if (this.limit > 0 && this.limit <= counter) break;
          ++counter;
        };
        return d + "</ul>";
      })
      .then(html => {
        localStorage.setItem(url, html);
        localStorage.setItem("timestamp_" + url, Date.now());
        this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(Date.now()).toLocaleString()}`;
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = html;
      }).catch(e => {
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = this.error + e;
        throw e;
      })
  }
}

customElements.define('ui-community-topics', OhCommunityTopics);
