import { html, define } from "./hybrids.js";
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

export const OhBindingDoc = {
  cacheTimeMinutes: 1440, // Ony day
  binding: 'eclipse/mqtt',
  refreshbutton: refreshButton(),
  timestamp: timestamp(),
  url: ({ binding }) => {
    const args = `${binding}`.split("/");
    if (args[0] == "eclipse")
      return "https://raw.githubusercontent.com/eclipse/smarthome/master/extensions/binding/org.eclipse.smarthome.binding." + args[1] + "/README.md";
    else
      return "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab.binding." + args[1] + "/README.md";
  },
  htmlData: ({ url, cachetime, timestamp, binding }) =>
    new Promise((resolve, reject) => (binding == "") ? reject("No binding set") : resolve()) // condition check
      .then(() => fromCache(url, timestamp + cachetime * 60 * 1000, updateCache))
      .catch(e => {
        return html`<div style="padding:inherit;margin:inherit;max-width:inherit">${e}. Url: ${url}</div>`;
      }),
  render: ({ htmlData }) => html`${html.resolve(htmlData, loading(), 0)}`,
};

define('oh-binding-doc', OhBindingDoc);
