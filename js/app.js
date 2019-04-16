// Register a service worker to serve assets from local cache.

function unregister () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (registration) {
      registration.unregister();
    });
  }
}

/* Hopefully no database operation takes longer than this */
const QUEUE_TIMEOUT = 5000;

/**
 * This is a proxy to the database web-worker and mostly implements
 * a message queue. Each exposed method returns a promise that
 * resolves as soon as the web-worker has send a response.
 * 
 * This is also an EventTarget, meaning that it emits events:
 * - "connectionLost": The connection is lost
 * - "connectionEstablished": The connection has been established
 * - "storeChanged": A complete table (e.g. "items", "things") has changed
 * - "storeItemChanged": One item in a table (e.g. one item in "items") has changed
 * - "storeItemRemoved"
 * - "storeItemAdded"
 * 
 * The following properties are available:
 * - "connected": Boolean
 * - "connectionErrorMessage": String
 * - "connectErrorType": The error type. E.g. 404, 403, 4041 (cross-origin) etc
 * - "host": The host:port that the storage wanted to connect to.
 *      If reconnect has not be called yet, this is `null`.
 * 
 * @category App
 * @memberof module:app
 */
class StorageConnector extends EventTarget {
  constructor() {
    super();
    this.queueid = 1;
    this.queue = {};
    this.host = null;
    this.connected = false;
    this.connectErrorType = 0;
    this.connectionErrorMessage = "";

    const workerfile = './js/storage-webworker.js';
    this.storageWorker = new Worker(workerfile, { name: "Storage Worker" }); // , type: "module" 
    this.storageWorker.onerror = (e) => {
      console.warn("Database web-worker failed!", e);
      this.dispatchEvent(new CustomEvent("connectionLost", { detail: e }));
    };
    this.port = this.storageWorker;
    this.port.onmessage = msgEvent => {
      const e = msgEvent.data;
      if (e.msgid) {
        const queueItem = this.queue[e.msgid];
        if (queueItem) {
          if (e.iserror)
            queueItem.accept(new Error(e.result));
          else
            queueItem.accept(e.result);
        }
      } else if (!e.type) {
        console.warn("Database event received without type!", e);
      } else {
        // console.debug("received notification from webworker", e);
        switch (e.type) {
          case "connectionLost":
            this.connected = false;
            this.connectErrorType = e.msg.type;
            this.connectionErrorMessage = e.msg.message;
            break;
          case "connectionEstablished":
            this.connected = true;
            this.connectErrorType = 0;
            this.connectionErrorMessage = "";
            break;
        }
        this.dispatchEvent(new CustomEvent(e.type, { detail: e.msg }));
      }
    };
  }
  dispose() {
    this.storageWorker.terminate();
  }
  dump() {
    const type = "dump";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid });
    return qitem.promise;
  }
  reconnect(host) {
    this.dispatchEvent(new CustomEvent("connecting"));
    this.host = host;
    const type = "reconnect";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, host });
    return qitem.promise;
  }
  configure(expireDurationMS, throttleTimeMS) {
    const type = "configure";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, expireDurationMS, throttleTimeMS });
    return qitem.promise;
  }
  /**
   * Get a value from the database (and fetch a refreshed copy in the background).
   * 
   * @param {String} storename The store name
   * @param {String} objectid If an object id is given, that specific object is returned from the table.
   * @param {Object} options An options object (sort:"criteria",direction:"",filter:"abc",filterKey:"name",limit: 100)
   */
  get(storename, objectid = null, options = null) {
    const type = "get";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, storename, objectid, options });
    return qitem.promise;
  }

  /**
   * Injects an object into the given store.
   * @param {String} storename The store name
   * @param {Object} objectdata The object data
   */
  injectTutorialData(storename, objectdata) {
    const type = "injectTutorialData";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, storename, objectdata });
    return qitem.promise;
  }

  /**
   * Removes all tutorial data from the database.
   */
  removeTutorialData() {
    const type = "removeTutorialData";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid });
    return qitem.promise;
  }
}

class QueueItem {
  constructor(storageConnector, type) {
    this.type = type;
    this.queue = storageConnector.queue;
    this.timer = setTimeout(() => this.timeout(), QUEUE_TIMEOUT);
    this.id = storageConnector.queueid;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.queue[this.id] = this;
    storageConnector.queueid += 1;
  }
  accept(val) {
    delete this.queue[this.id];
    clearTimeout(this.timer);
    if (val instanceof Error) {
      this.reject(val);
    } else
      this.resolve(val);
  }
  timeout() {
    delete this.queue[this.id];
    this.reject("StorageConnector queue item '" + this.type + "' timed out");
  }
}

class FetchError extends Error {
  constructor(message, status) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.status = status;
  }
  networkErrorMessage() {
    return this.message + " (" + this.status + ")";
  }
  toString() {
    return this.message + " (" + this.status + ")";
  }
}

/**
 * Used if multiple items are pushed to REST. A list of failed items is kept.
 */
class MultiRestError extends Error {
  constructor(message, failedItems, ...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.failedItems = failedItems;
  }
}

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: signal, validateHttpsCertificates: false, muteHttpExceptions: true }).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });
  if (!response.ok) {
    const body = await response.text();
    throw new FetchError(response.statusText + " " + body, response.status);
  }
  return response;
}
async function fetchMethodWithTimeout(url, method, body, contentType = 'application/json', timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const headers = new Headers({ 'content-type': contentType });
  const mode = 'cors';
  const validateHttpsCertificates = false;
  const muteHttpExceptions = true;
  const options = { signal, method, mode, body, validateHttpsCertificates, muteHttpExceptions };
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, contentType ? Object.assign(options, { headers }) : options).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });  if (!response.ok) {
    throw new FetchError(response.statusText, response.status);
  }
  return response;
}

/**
 * Creates a notification dom element.
 * 
 * @param {String} id The dom ID
 * @param {String} message The message
 * @param {Boolean} persistent If set to true, the notification will not auto-dismiss
 * @param {Integer} timeout The timeout in milliseconds.
 * @see module:uicomponents
 * @category App
 * @memberof module:app
 */
function createNotification(id, message, persistent = false, timeout = 5000) {
  const oldEl = id ? document.getElementById(id) : null;
  const el = oldEl ? oldEl : document.createElement("ui-notification");
  if (id) el.id = id;
  el.setAttribute("closetime", timeout);
  if (persistent) el.setAttribute("persistent", "true");
  el.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(el);
}

var version = "1.0.3";

const url = "https://cors-anywhere.herokuapp.com/https://registry.npmjs.org/openhab-paper-ui-ng/latest";
const cachetime = 60 * 6; // 6 hours of caching

/**
 * Performs a version check and shows a notification if a newer version is available.
 * @category App
 * @memberof module:app
 */
async function versioncheck() {
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

  if (version != cachedData) {
    console.warn(`Not the newest version! You are on ${version}. Current is: ${cachedData}`);
    window.requestAnimationFrame(() => {
      createNotification("version", `Not the newest version! You are on ${version}. Current is: ${cachedData}`, false, 5000);
    });
  } else {
    console.log(`You are on the newest version: ${version}. Last check: ${cacheTimestamp.toLocaleString()}`);
  }
}

/**
 * This index file links in all other files in this directory.
 * 
 * The service worker is setup in here and the database worker is started.
 * Some common methods are also defined, like "createNotification", "toggleSidebar". 
 */

// Service worker for caching
// register('./sw.js', {
//     offline() {
//         console.log('No internet connection found. App is running in offline mode.')
//     },
//     error(error) {
//         console.error('Error during service worker registration:', error)
//     }
// })

console.warn("Service worker disabled for development!");
unregister();

versioncheck();

window.toggleSidebar = (event) => {
  document.querySelector('body').classList.toggle('showsidebar');
  event.preventDefault();
};

/**
 * The proxy model instance to communicate with the data model.
 * 
 * @type {StorageConnector}
 * @see module:storage-webworker
 */
const store = new StorageConnector();

store.addEventListener("connecting", () => createNotification("connecting", "Connecting&hellip;", true, 2000), { passive: true });

store.addEventListener("connectionEstablished", e => {
  const connectingN = document.getElementById("connecting");
  if (!connectingN) return;
  connectingN.innerHTML = `<div>Connected!</div>`;
  connectingN.hideAfterCloseTime();
}, { passive: true });

store.addEventListener("connectionLost", e => {
  const connectingN = document.getElementById("connecting");
  if (connectingN) connectingN.hideAfterCloseTime();

  if (e.toString().includes("TypeError")) {
    if (window.location.pathname == "/login.html") {
      createNotification("login", "Connection to " + store.host + " failed", false);
    } else {
      createNotification("login", "Cross-orgin access denied for " + store.host + ".<br><a href='login.html' data-close>Login to openHab instance</a></div>", false);
    }
  }
  else {
    if (window.location.pathname == "/login.html") {
      createNotification("login", "Connection to " + store.host + " failed", false);
    }
    else {
      createNotification("login", "Could not connect to openHAB on " + store.host + ".<br><a href='login.html' data-close>Login to openHab instance</a></div>", false);
    }
  }
}, { passive: true });

setTimeout(() => {
  let host = localStorage.getItem("host");
  if (!host) host = "demo"; //host = window.location.origin;
  store.configure(1000 * 60 * 60, 2000)
    .then(() => store.reconnect(host))
    .catch(() => { }); // already handled by "connectionLost" event
}, 100);

/**
 * The main / app module.
 * 
 * Contains the proxy to communicate with the data model.
 * 
 * @category App
 * @module app
 */

export { createNotification, store, FetchError, MultiRestError, fetchWithTimeout, fetchMethodWithTimeout };
