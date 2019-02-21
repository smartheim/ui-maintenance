/**
 * This index file links in all other files in this directory.
 */

import { register, unregister } from 'register-service-worker'
import { StorageConnector } from './store';
export * from '../../common/fetch';
export * from './oh-data-bind'

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

window.toggleSidebar = (event) => {
  document.querySelector('body').classList.toggle('showsidebar');
  event.preventDefault();
}

export function openhabHost() {
  var host = localStorage.getItem("host");
  if (!host) host = "demo"; //host = window.location.origin;
  return host;
}

export function createNotification(id, message, persistent = false, timeout = 5000) {
  const oldEl = id ? document.getElementById(id) : null;
  var el = oldEl ? oldEl : document.createElement("ui-notification");
  if (id) el.id = id;
  el.setAttribute("closetime", timeout);
  if (persistent) el.setAttribute("persistent", "true");
  el.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(el);
}

var store = new StorageConnector();

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
      createNotification("login", "Connection to " + openhabHost() + " failed", false);
    } else {
      createNotification("login", "Cross-orgin access denied for " + openhabHost() + ".<br><a href='login.html' data-close>Login to openHab instance</a></div>", false);
    }
  }
  else {
    if (window.location.pathname == "/login.html") {
      createNotification("login", "Connection to " + openhabHost() + " failed", false);
    }
    else {
      createNotification("login", "Could not connect to openHAB on " + openhabHost() + ".<br><a href='login.html' data-close>Login to openHab instance</a></div>", false);
    }
  }
}, { passive: true });

setTimeout(() => {
  store.configure(1000 * 60 * 60, 2000)
    .then(() => store.reconnect(openhabHost()))
    .catch(() => { }); // already handled by "connectionLost" event
}, 100);

export { store };