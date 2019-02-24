import { fetchWithTimeout } from '../_common/fetch';
import { Marked } from "../_marked/index.mjs";

/**
 * This element renders the changelog from the github release page
 * 
 * Attributes:
 * - "url": For example "https://api.github.com/repos/openhab/openhab-distro/releases/latest".
 * - "cachetime": A cache time in minutes. Default is one day.
 * - "hasissues": read-only. Will be set, when there are issues found for the given filter.
 *                Use this in css selectors to show/hide etc.
 * 
 * Methods:
 * - reload(): Reloads data.
 */
class OhChangelog extends HTMLElement {
  constructor() {
    super();
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
    this.marked = new Marked();
    this.renderer = new this.marked.Renderer();
    this.toc = [];

    /**
     * To get the TOC, we need to listen to the renderer.heading method
     */
    this.renderer.heading = (text, level) => {
      var slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      this.toc.push({
        level: level,
        slug: slug,
        title: text
      });
      return "<h" + level + " id=\"" + slug + "\"><a href=\"#" + slug + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
    };
  }
  static get observedAttributes() {
    return ['url', 'toctarget', 'cachetime'];
  }
  connectedCallback() {
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : "https://api.github.com/repos/openhab/openhab-distro/releases/latest";
    this.toctarget = this.hasAttribute("toctarget") ? this.getAttribute("toctarget") : null;
    this.cachetime = this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : 1440; // One day in minutes
    if (this.initdone) this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.url) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    var cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    var cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }
    if (cachedData) {
      var e = this.toctarget ? document.querySelector(this.toctarget) : null;
      if (e) e.innerHTML = localStorage.getItem("toc_" + this.url);
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = cachedData;
    } else {
      this.reload();
    }
  }
  reload() {
    this.toc = [];
    localStorage.removeItem("timestamp_" + this.url);

    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;

    fetchWithTimeout(this.url)
      .then(response => response.json())
      .then(async (json) => {
        var htmlstr = "";
        if (Array.isArray(json)) {
          for (var i = 0; i < json.length; i++) {
            var release = json[i];
            const markdown = await this.marked.parse(release.body, { renderer: this.renderer });
            htmlstr += "<h2>" + release.name + "</h2>" + markdown + "<hr>";
          }
        } else {
          var release = json;
          const markdown = await this.marked.parse(release.body, { renderer: this.renderer });
          htmlstr += "<h2>" + release.name + "</h2>" + markdown;
        }
        localStorage.setItem(this.url, htmlstr);
        localStorage.setItem("timestamp_" + this.url, Date.now());

        if (this.toc && this.toc.length) {
          var tocstr = "";
          for (var t of this.toc) {
            if (t.level > 4)
              continue;
            if (t.level == 3) {
              tocstr += "<li class='level3'>";
            } else
              if (t.level == 4) {
                tocstr += "<li class='level4'>";
              } else
                tocstr += "<li>";

            tocstr += "<a href=\"#" + t.slug + "\">" + t.title + "</a>";
            tocstr += "</li>";
          }
          localStorage.setItem("toc_" + this.url, tocstr);
        }
        return Promise.resolve({ main: htmlstr, toc: tocstr });
      })
      .then(data => {
        var e = document.querySelector(this.toctarget);
        if (e) e.innerHTML = data.toc;
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = data.main;
      }).catch(e => {
        while (this.firstChild) { this.firstChild.remove(); }
        console.warn(e);
        this.innerHTML = this.error + e;
      })
  }
}

customElements.define('ui-changelog', OhChangelog);
