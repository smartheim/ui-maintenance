import { fetchMethodWithTimeout } from '../_common/fetch';
import { createNotification } from './notification';
import * as data from '../../package.json';

const url = "https://cors-anywhere.herokuapp.com/https://registry.npmjs.org/openhab-paper-ui-ng/latest";
const cachetime = 60 * 6; // 6 hours of caching

/**
 * Performs a version check and shows a notification if a newer version is available.
 * @category App
 * @memberof module:app
 */
export async function versioncheck() {
  let cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + url)) || 0;
  if (cacheTimestamp > 0)
    cacheTimestamp = new Date(cacheTimestamp + cachetime * 60 * 1000);
  else
    cacheTimestamp = null;

  let cachedData = null;
  if (cacheTimestamp && (cacheTimestamp > Date.now())) {
    cachedData = localStorage.getItem(url);
  }

  if (!cachedData) {
    cachedData = await fetchMethodWithTimeout(url).then(d => d.json());
    cachedData = cachedData.version;
    localStorage.setItem(url, cachedData);
    localStorage.setItem("timestamp_" + url, Date.now());
  }

  if (data.version != cachedData) {
    console.warn(`Not the newest version! You are on ${data.version}. Current is: ${cachedData}`)
    window.requestAnimationFrame(() => {
      createNotification("version", `Not the newest version! You are on ${data.version}. Current is: ${cachedData}`, false, 5000);
    });
  } else {
    console.log(`You are on the newest version: ${data.version}. Last check: ${cacheTimestamp.toLocaleString()}`);
  }
}
