import { html, define } from "./hybrids.js";
import { Marked } from "./marked/index.mjs";

const marked = new Marked();

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), 5000);
  return fetch(url, { signal });
}

export const OhBindingDoc = {
  cacheTimeMinutes: 1440, // Ony day
  binding: 'eclipse/mqtt',
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
  url: ({ binding }) => {
      const args = `${binding}`.split("/");
      if (args[0]=="eclipse")
        return "https://raw.githubusercontent.com/eclipse/smarthome/master/extensions/binding/org.eclipse.smarthome.binding."+args[1]+"/README.md";
      else
        return "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab.binding."+args[1]+"/README.md";
  },
  timestamp: {
    get: ({ url, cacheTimeMinutes }) => {
      var cacheTimestamp = localStorage.getItem("timestamp_"+url);
      if (!cacheTimestamp) return Date.now()-cacheTimeMinutes*60*1000;
      return cacheTimestamp;  
    },
    set: (host) => {
      localStorage.removeItem("timestamp_"+host.url);
    }
  },
  htmlData: ({ url, cacheTimeMinutes, timestamp }) => {
    // First try to use the cached text
    var cachedData = localStorage.getItem(url);
    if (cachedData && (timestamp+cacheTimeMinutes*60*1000)>Date.now()) {
      return Promise.resolve(cachedData)
        .then(value => html`<div innerHTML="${value}"></div>`);
    }

    return fetchWithTimeout(url)
    .then(function(response) {
      if(!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response;
    })
    .then(response => response.text())
    .then(str => marked.parse(str))
    .then(str => {
      localStorage.setItem(url, str);
      localStorage.setItem("timestamp_"+url, Date.now());
      return str;
    })
    .then(value => html`<div innerHTML="${value}"></div>`)
    .catch(e => html`<div>Error! ${e}</div>`)
  },
  render: ({ htmlData }) => html`${html.resolve(htmlData, html`Loading...`,0 )}`,
};

define('oh-binding-doc', OhBindingDoc);
