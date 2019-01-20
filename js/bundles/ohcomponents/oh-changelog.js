import { html, define, render } from "./utils/hybrids.js";
import { Marked } from "./marked/index.mjs";
import { fetchWithTimeout } from '../../common/fetch'
import { timestamp, fromCache, refreshButton } from "./utils/factory-timestamp";
import loading from "./utils/loading-template";

const marked = new Marked();
var renderer = new marked.Renderer();

const OhChangelog = {
  cacheTimeMinutes: 1440, // Ony day
  url: "https://api.github.com/repos/openhab/openhab-distro/releases/latest",
  timestamp: timestamp(),
  refreshbutton: refreshButton(),
  tocid: "",
  htmlData: ({ url, cachetime, timestamp, tocid }) =>
    new Promise((resolve, reject) => (url == "") ? reject("No URL set") : resolve(renderer.toc = [])) // condition check
      .then(() => fromCache(url, timestamp + cachetime * 60 * 1000, updateCache))
      .then(html => {
        var e = document.getElementById(tocid);
        if (e) e.innerHTML = localStorage.getItem("toc_" + url);
        console.log("header found: ", e, tocid);
        return html;
      })
      .catch(e => {
        return html`<div style="padding:inherit;margin:inherit;max-width:inherit">${e}. Url: ${url}</div>`;
      }),
  render: render(({ htmlData }) => html`${html.resolve(htmlData, loading(), 0)}`, { shadowRoot: false })
};

/**
 * To get the TOC, we need to listen to the renderer.heading method
 */
renderer.heading = function (text, level) {
  var slug = text.toLowerCase().replace(/[^\w]+/g, '-');
  this.toc.push({
    level: level,
    slug: slug,
    title: text
  });
  return "<h" + level + " id=\"" + slug + "\"><a href=\"#" + slug + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
};

/**
 * Retrieves a fresh value for the cache
 * @param {String} url Url
 * @returns {Promise} Promise with parsed html
 */
function updateCache(url, args) {
  return fetchWithTimeout(url)
    .then(response => response.json())
    .then(async (json) => {
      var str = "";
      if (Array.isArray(json)) {
        for (var i = 0; i < json.length; i++) {
          var release = json[i];
          const markdown = await marked.parse(release.body, { renderer: renderer });
          str += "<h2>" + release.name + "</h2>" + markdown + "<hr>";
        }
      } else {
        var release = json;
        const markdown = await marked.parse(release.body, { renderer: renderer });
        str += "<h2>" + release.name + "</h2>" + markdown;
      }
      str += "";

      if (renderer.toc && renderer.toc.length) {
        var tocstr = "";
        for (var t of renderer.toc) {
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
        localStorage.setItem("toc_" + url, tocstr);
      }
      return Promise.resolve(str);
    });
}

define('oh-changelog', OhChangelog);
