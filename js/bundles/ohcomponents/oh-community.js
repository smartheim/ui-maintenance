import { fetchWithTimeout } from '../../common/fetch';

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
class OhCommunityTopics extends HTMLElement {
  constructor() {
    super();
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
    this.attributeChangedCallback();
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  set contenturl(val) {
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
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.cachetime = this.getAttribute("cachetime") || 1440; // One day in minutes
    this.limit = this.hasAttribute("limit") ? parseInt(this.getAttribute("limit")) : null;
    this.topics = this.hasAttribute("topics") ? this.getAttribute("topics") : null;
    this.order = this.hasAttribute("order") ? this.getAttribute("order") : "created";
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : "https://cors-anywhere.herokuapp.com/https://community.openhab.org";
    this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.contenturl) {
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = localStorage.getItem("timestamp_" + this.contenturl);
    var cachedData = cacheTimestamp ? localStorage.getItem(this.contenturl) : null;
    if (cachedData && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      this.innerHTML = cachedData;
    } else {
      this.reset();
    }
  }
  reset() {
    if (!this.contenturl) {
      this.innerHTML = "No url given!";
      return;
    }
    localStorage.removeItem("timestamp_" + this.contenturl);
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
        this.innerHTML = html;
      }).catch(e => {
        this.innerHTML = this.error + e;
        throw e;
      })
  }
}

customElements.define('oh-community-topics', OhCommunityTopics);
