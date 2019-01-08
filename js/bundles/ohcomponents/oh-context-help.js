import { html, define, render } from "./hybrids.js";
import { Marked } from "./marked/index.mjs";
import { fetchWithTimeout } from '../../common/fetch'
import { timestamp, fromCache, refreshButton } from "./factory-timestamp";
import loading from "./loading-template";

const marked = new Marked();

/**
 * Retrieves a fresh value for the cache
 * @param {String} url Url
 * @returns {Promise} Promise with parsed html
 */
function updateCache(url) {
  return fetchWithTimeout(url)
    .then(response => response.text())
    .then(str => marked.parse(str));
}

export const OhContextHelp = {
  cachetime: 1440, // Ony day in minutes
  timestamp: timestamp(),
  refreshbutton: refreshButton(),
  url: "",
  htmlData: ({ url, cachetime, timestamp }) =>
    new Promise((resolve, reject) => (url == "") ? reject("No URL set") : resolve()) // condition check
      .then(() => fromCache(url, timestamp + cachetime * 60 * 1000, updateCache))
      .catch(e => {
        return html`<div style="padding:inherit;margin:inherit;max-width:inherit">${e}. Url: ${url}</div>`;
      }),
  render: render(({ htmlData }) => html`${html.resolve(htmlData, loading(), 200)}`, { shadowRoot: false })
};

define('oh-context-help', OhContextHelp);
