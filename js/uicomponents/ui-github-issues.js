import { fetchWithTimeout } from '../_common/fetch';

/**
* @category Web Components
* @customelement ui-github-issues
* @description This element renders a list of github-issue links (ul->li->a).
* @attribute url For example "https://api.github.com/repos/openhab/openhab2-addons/issues".
* @attribute filter For example "deconz"
* @attribute cachetime A cache time in minutes. Default is one day.
* @attribute hasissues  read-only. Will be set, when there are issues found for the given filter.
 *                Use this in css selectors to show/hide etc.
* @example <caption>Github issues example</caption>
* <ui-github-issues></ui-github-issues>
*/
class OhGithubIssues extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "none";
    this.label = this.getAttribute("label");
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.cachetime = (this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : null) || 1440; // One day in minutes
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  static get observedAttributes() {
    return ['url',
      'filter'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.url = this.getAttribute("url");
    this.filter = this.getAttribute("filter");
    if (this.filter) this.filter = this.filter.toLowerCase();
    if (this.initdone) this.checkCacheAndLoad();
  }
  /**
   * Refreshes the content (either from the cache or if that is invalid from the url).
   */
  checkCacheAndLoad() {
    if (!this.url) {
      this.style.display = "block";
      this.setAttribute("hasissues", "");
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(cacheTimestamp).toLocaleString()}`;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }

    if (cachedData) {
      this.renderData(JSON.parse(cachedData));
    } else {
      this.reload();
    }
  }
  /**
   * Force reloads the content from the given url.
   */
  async reload() {
    localStorage.removeItem("timestamp_" + this.url);
    if (localStorage.getItem("loading_" + this.url)) {
      console.warn("Already loading the issues list");
      return;
    }
    // Prevent double loading
    localStorage.setItem("loading_" + this.url, "true");
    // safety measure: Allow reloading after 30s
    setTimeout(() => localStorage.removeItem("loading_" + this.url), 30000);

    this.innerHTML = this.loading;
    try {
      let fullresponse = [];

      let response = await fetchWithTimeout(this.url);
      const linkHeader = response.headers.get("Link");

      let otherUrls = [response.json().then(json => (fullresponse = fullresponse.concat(json)), this.renderData(fullresponse))];

      // The Link header looks like this:
      // <https://api.github.com/repositories/19753195/issues?page=17>; rel="last", <https://api.github.com/repositories/19753195/issues?page=1>; rel="first"
      if (linkHeader) {
        const links = linkHeader.split(",");
        for (let link of links) {
          if (link.includes('rel="last"')) {
            let result = link.match(/<(.*)>/);
            if (result.length != 2) continue;
            const [baseurl, pagenoStr] = result[1].split("page=");
            const lastPage = parseInt(pagenoStr);
            for (let i = 2; i <= lastPage; ++i) {
              const url = baseurl + "page=" + i;
              console.log("RELOAD ISSUES NEXT LINK", url);
              otherUrls.push(fetchWithTimeout(url).then(r => r.json()).then(json => (fullresponse = fullresponse.concat(json)), this.renderData(fullresponse)));
            }
          }
        }
      }

      await Promise.all(otherUrls);

      localStorage.setItem(this.url, JSON.stringify(fullresponse));
      localStorage.setItem("timestamp_" + this.url, Date.now());
      localStorage.removeItem("loading_" + this.url); // Allow reloading
      this.renderData(fullresponse);
    } catch (e) {
      localStorage.removeItem("loading_" + this.url); // Allow reloading
      console.warn(e);
      this.style.display = "block";
      this.setAttribute("hasissues", "");
      this.innerHTML = this.error + e + " " + this.url;
    }
  }
  renderData(data, filter = null) {
    if (!filter) filter = this.filter;
    while (this.firstChild) { this.firstChild.remove(); }

    const ul = document.createElement('ul');
    let counter = 0;
    for (const entry of data) {
      if (!entry.title.toLowerCase().includes("[" + filter + "]")) continue;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.innerHTML = entry.title;
      a.href = entry.html_url;
      a.target = "_blank";
      li.appendChild(a);
      ul.appendChild(li);
      ++counter;
    }
    if (counter > 0) {
      this.style.display = "block";
    }
    else {
      this.style.display = "none";
      return;
    }
    ul.classList.add("mb-0");

    {
      const el = document.createElement("a");
      el.href = "#";
      el.title = "Reload";
      el.innerHTML = `<i class="fas fa-sync-alt">`;
      el.style.float = "right";
      el.addEventListener("click", e => { e.preventDefault(); this.reload(); });
      this.appendChild(el);
    }

    {
      const el = document.createElement("a");
      el.href = "#";
      el.title = "Close";
      el.innerHTML = `<i class="fas fa-times">`;
      el.style.float = "right";
      el.classList.add("mr-2");
      el.addEventListener("click", e => { e.preventDefault(); this.style.display = "none"; });
      this.appendChild(el);
    }

    {
      const detailsEl = document.createElement("details");
      const sumEl = document.createElement("summary");
      sumEl.innerHTML = this.label;
      detailsEl.appendChild(sumEl);
      detailsEl.appendChild(ul);
      this.appendChild(detailsEl);
    }

    if (counter > 0) {
      this.setAttribute("hasissues", "");
    }
    else {
      this.removeAttribute('hasissues');
    }
  }
}

customElements.define('ui-github-issues', OhGithubIssues);