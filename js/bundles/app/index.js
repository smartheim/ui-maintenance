/**
 * This index file links in all other files in this directory.
 */

import { register, unregister } from 'register-service-worker'
import { StorageConnector } from './store';
export * from '../../common/fetch';

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

function openhabHost() {
  var host = localStorage.getItem("host");
  if (!host) host = "demo"; //host = window.location.origin;
  return host;
}

var store = new StorageConnector();

store.addEventListener("connecting", e => {
  var el = document.createElement("ui-notification");
  el.id = "connecting";
  el.setAttribute("closetime", 2000);
  el.setAttribute("persistent", true);
  el.innerHTML = `<div>Connecting&hellip;</div>`;
  document.body.appendChild(el);
}, false);

store.addEventListener("connectionEstablished", e => {
  const connectingN = document.getElementById("connecting");
  connectingN.innerHTML = `<div>Connected!</div>`;
  if (connectingN) connectingN.hideAfterCloseTime();
}, false);

store.addEventListener("connectionLost", e => {
  const connectingN = document.getElementById("connecting");
  if (connectingN) connectingN.hideAfterCloseTime();

  if (e.toString().includes("TypeError")) {
    if (window.location.pathname == "/login.html") {
      var el = document.createElement("ui-notification");
      el.id = "login";
      el.setAttribute("persistent", false);
      el.innerHTML = `<div>Connection to ${openhabHost()} failed</div>`;
      document.body.appendChild(el);
    } else {
      var el = document.createElement("ui-notification");
      el.id = "login";
      el.setAttribute("persistent", false);
      el.innerHTML = `<div>Cross-orgin access denied for ${openhabHost()}.<br>
      <a href="login.html" data-close>Login to openHab instance</a></div>`;
      document.body.appendChild(el);
    }
  }
  else {
    if (window.location.pathname == "/login.html") {
      var el = document.createElement("ui-notification");
      el.id = "login";
      el.setAttribute("persistent", false);
      el.innerHTML = `<div>Connection to ${openhabHost()} failed</div>`;
      document.body.appendChild(el);
    }
    else {
      var el = document.createElement("ui-notification");
      el.id = "login";
      el.setAttribute("persistent", false);
      el.innerHTML = `<div>Could not connect to openHAB on ${openhabHost()}.<br>
      <a href="login.html" data-close>Login to openHab instance</a></div>`;
      document.body.appendChild(el);
    }
  }
}, false);

setTimeout(() => {
  store.configure(1000 * 60 * 60, 2000)
    .then(() => store.reconnect(openhabHost()))
    .catch(() => { }); // already handled by "connectionLost" event
}, 100);

export { store };