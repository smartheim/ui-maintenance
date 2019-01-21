import { fetchWithTimeout } from '../../common/fetch';

/**
 * This element renders a list of github-issue links (ul->li->a).
 * 
 * Attributes:
 * - "url": For example "https://api.github.com/repos/openhab/openhab2-addons/issues".
 * - "filter": "deconz"
 * - "cachetime": A cache time in minutes. Default is one day.
 * - "hasissues": read-only. Will be set, when there are issues found for the given filter.
 *                Use this in css selectors to show/hide etc.
 * 
 * Methods:
 * - reload(): Reloads data.
 */
class OhGithubIssues extends HTMLElement {
  constructor() {
    super();
    if (!this.style.display || this.style.display.length==0)
      this.style.display = "block";
    this.attributeChangedCallback();
  }
  static get observedAttributes() {
    return ['url', 'filter'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.url = this.getAttribute("url");
    this.filter = this.getAttribute("filter");
    if (this.filer) this.filer = this.filer.toLowerCase();
    this.title = this.getAttribute("title");
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.cachetime = this.getAttribute("cachetime") || 1440; // One day in minutes
    this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.url) {
      this.setAttribute("hasissues", "");
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = localStorage.getItem("timestamp_" + this.url);
    var cachedData = cacheTimestamp ? localStorage.getItem(this.url) : null;
    if (cachedData && (cacheTimestamp+this.cachetime * 60 * 1000 > Date.now())) {
      this.renderData(JSON.parse(cachedData), this.filter);
    } else {
      this.reload();
    }
  }
  reload() {
    localStorage.removeItem("timestamp_" + this.url);

    this.innerHTML = this.loading;

    fetchWithTimeout(this.url)
      .then(response => response.json())
      .then(json => {
        localStorage.setItem(this.url,JSON.stringify(json));
        localStorage.setItem("timestamp_" + this.url, Date.now());
        this.renderData(json, this.filter);
      }).catch(e => {
        this.setAttribute("hasissues", "");
        this.innerHTML = this.error + e;
      })
  }
  renderData(data, filter) {
    const ul = document.createElement('ul');
    var counter = 0;
    for (const entry of data) {
      if (!entry.title.toLowerCase().includes(filter)) continue;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.innerHTML = entry.title;
      a.href = entry.url;
      a.target = "_blank";
      li.appendChild(a);
      ul.appendChild(li);
      ++counter;
    }
    const titleEl = document.createElement("div");
    titleEl.innerHTML = this.title;
    this.innerHTML = "";
    this.appendChild(titleEl);
    this.appendChild(ul);
    if (counter > 0) {
      this.setAttribute("hasissues", "");
    } else {
      this.removeAttribute('hasissues');
    }
  }
}

customElements.define('oh-github-issues', OhGithubIssues);
