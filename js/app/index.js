/**
 * This index file links in all other files in this directory.
 * 
 * The service worker is setup in here and the database worker is started.
 * Some common methods are also defined, like "createNotification", "toggleSidebar". 
 */

import { register, unregister } from 'register-service-worker'
import { StorageConnector } from './store';
export * from '../_common/fetch';
import { createNotification } from './notification';
import { versioncheck } from './versioncheck';

export { createNotification };

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
}

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

export { store };

/**
 * The main / app module.
 * 
 * Contains the proxy to communicate with the data model.
 * 
 * @category App
 * @module app
 */