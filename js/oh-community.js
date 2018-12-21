import { html, define, render } from './hybrids.js';

const controller = new AbortController();
const signal = controller.signal;

export function fetchWithTimeout(url) {
  setTimeout(() => controller.abort(), 5000);
  return fetch(url, { signal });
}

export function resetCache(host) {
  host.timestamp = 0;
}

export function topicListHtml(jsonData) {
  var d = "<ul>";
  jsonData.topic_list.topics.forEach(topic => {
    const date = new Date(topic.created_at).toLocaleDateString();
    d += "<li><a href='https://community.openhab.org/t/" + topic.slug + "/" + topic.id + "'>" + topic.title + "</a> <small>" + date + "</small></li>"
  });
  return d + "</ul>";
}

export const OhCommunityTopics = {
  cacheTimeMinutes: 1440, // One day
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
  topics: "",
  order: "?order=created",
  url: ({ topics, order }) => {
    if (order != "")
      return "https://cors-anywhere.herokuapp.com/https://community.openhab.org/" + topics + ".json?order="+order;
    else
      return "https://cors-anywhere.herokuapp.com/https://community.openhab.org/" + topics + ".json";
  },
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
  htmlData: ({ url, cacheTimeMinutes, timestamp }) => {
    // First try to use the cached text
    var cachedData = localStorage.getItem(url);
    if (cachedData && (timestamp + cacheTimeMinutes * 60 * 1000) > Date.now()) {
      return Promise.resolve(cachedData)
        .then(value => html`<div innerHTML="${value}"></div>`);
    }

    return fetchWithTimeout(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response;
      })
      .then(response => response.text())
      .then(str => JSON.parse(str))
      .then(str => topicListHtml(str))
      .then(str => {
        localStorage.setItem(url, str);
        localStorage.setItem("timestamp_" + url, Date.now());
        return str;
      })
      .then(value => html`<div innerHTML="${value}"></div>`)
      .catch(e => html`<div>${e}. Url: ${url}</div>`)
  },
  render: render(({ htmlData }) => html`
    ${html.resolve(htmlData, html`Loading...`, 0)}
  `, { shadowRoot: false })
};

define('oh-community-topics', OhCommunityTopics);
