import { html, define, render } from './hybrids.js';
import { fetchWithTimeout } from '../../common/fetch'
import { timestamp, fromCache, refreshButton } from "./factory-timestamp";
import loading from "./loading-template";

/**
 * Retrieves a fresh value for the cache
 * @param {String} url Url
 * @returns {Promise} Promise with parsed html
 */
function updateCache(url, args) {
  return fetchWithTimeout(url,10000)
    .then(response => response.json())
    .then(jsonData => {
      var d = "<ul>";
      var counter = 0;
      for (var topic of jsonData.topic_list.topics) {
        const date = new Date(topic.created_at).toLocaleDateString();
        d += "<li><a target='_blank' href='https://community.openhab.org/t/" + topic.slug + "/" + topic.id + "'>" + topic.title + "</a> <small>" + date + "</small></li>"
        if (args.limit > 0 && args.limit <= counter) break;
        ++counter;
      };
      return d + "</ul>";
    });
}

export const OhCommunityTopics = {
  cachetime: 1440, // One day
  timestamp: timestamp(),
  refreshbutton: refreshButton(),
  limit: 0,
  topics: "",
  order: "created",
  url: ({ topics, order }) => {
    if (order != "")
      return "https://cors-anywhere.herokuapp.com/https://community.openhab.org/" + topics + ".json?order=" + order;
    else
      return "https://cors-anywhere.herokuapp.com/https://community.openhab.org/" + topics + ".json";
  },
  htmlData: ({ url, cachetime, timestamp, limit, topics }) =>
    new Promise((resolve, reject) => (topics == "") ? reject("No topics set") : resolve()) // condition check
      .then(() => fromCache(url, timestamp + cachetime * 60 * 1000, updateCache, {limit:limit}))
      .catch(e => {
        return html`<div style="padding:inherit;margin:inherit;max-width:inherit">${e}. Url: ${url}</div>`;
      }),
  render: render(({ htmlData }) => html`${html.resolve(htmlData, loading(), 300)}`, { shadowRoot: false })
};

define('oh-community-topics', OhCommunityTopics);
