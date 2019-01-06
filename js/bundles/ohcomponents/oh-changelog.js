import { html, define, render } from "./hybrids.js";
import { Marked } from "./marked/index.mjs";

const marked = new Marked();
var renderer = new marked.Renderer();

renderer.toc = [];

renderer.heading = function (text, level) {
  var slug = text.toLowerCase().replace(/[^\w]+/g, '-');
  this.toc.push({
    level: level,
    slug: slug,
    title: text
  });
  return "<h" + level + " id=\"" + slug + "\"><a href=\"#" + slug + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
};

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), 5000);
  return fetch(url, { signal });
}

async function convertToHtml(json) {
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
  return Promise.resolve(str);
}

export const OhChangelog = {
  cacheTimeMinutes: 1440, // Ony day
  url: "https://api.github.com/repos/openhab/openhab-distro/releases/latest",
  timestamp: {
    get: ({ url, cacheTimeMinutes }) => {
      var cacheTimestamp = localStorage.getItem("timestamp_" + url);
      if (!cacheTimestamp) return Date.now() - cacheTimeMinutes * 60 * 1000;
      return cacheTimestamp;
    },
    set: (host) => {
      localStorage.removeItem("timestamp_" + host.url);
    }
  },
  refreshbutton: {
    set: (host, value) => { },
    connect: (host, key) => {
      var e = document.getElementById(host.getAttribute(key));
      const clickListener = (event) => {
        host.timestamp = 0;
        console.log("clicked");
        event.preventDefault();
      };
      if (e) e.addEventListener("click", clickListener);
      return () => {
        if (e) e.removeEventListener("click", clickListener);
      }
    }
  },
  tocid: "",
  htmlData: ({ url, cacheTimeMinutes, timestamp, tocid }) => {
    // First try to use the cached text
    var cachedData = localStorage.getItem(url);
    if (cachedData && (timestamp + cacheTimeMinutes * 60 * 1000) > Date.now()) {
      return Promise.resolve(cachedData)
        .then(value => html`<div style="padding:inherit;margin:inherit;max-width:inherit" innerHTML="${value}"></div>`)
        .then(str => {
          var e = document.getElementById(tocid);
          if (e) e.innerHTML = localStorage.getItem("toc_" + url);
  console.log("header found: ", e, tocid);
          return str;
        });
    }

    return fetchWithTimeout(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response;
      })
      .then(response => response.json())
      .then(convertToHtml)
      .then(str => {
        localStorage.setItem(url, str);
        localStorage.setItem("timestamp_" + url, Date.now());
        if (renderer.toc && renderer.toc.length) {
          var tocstr = "<ul>";
          for (var t of renderer.toc) {
            if (t.level>4) continue;
            tocstr += "<li>";

            if (t.level==3) {
              tocstr += "<ul class='level-3'><li>"
            }
            if (t.level==4) {
              tocstr += "<ul class='level-3'><li>"
            }
            tocstr += "<a href=\"#" + t.slug + "\">" + t.title + "</a>";

            if (t.level==3) {
              tocstr += "</li></ul>"
            }
            if (t.level==4) {
              tocstr += "</li></ul>"
            }

            tocstr += "</li>";
          };
          localStorage.setItem("toc_" + url, tocstr + "</ul>");
          var e = document.getElementById(tocid);
          if (e) e.innerHTML = localStorage.getItem("toc_" + url);
        }
        return str;
      })
      .then(value => html`<div style="padding:inherit;margin:inherit;max-width:inherit" innerHTML="${value}"></div>`)
      .catch(e => html`<div>Error! ${e}</div>`)
  },
  render: render(({ htmlData }) => html`${html.resolve(htmlData, html`Loading...`, 0)}`, { shadowRoot: false })
};

define('oh-changelog', OhChangelog);
