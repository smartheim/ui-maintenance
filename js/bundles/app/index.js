/**
 * This index file links in all other files in this directory.
 * 
 * It also provides "toggleContext" and "toggleSidebar" commands
 * in the global context.
 * 
 * On every DOMContentLoaded event (async/ajax page load) and normal
 * page load the method "startupAfterDomChanged" is called. Add your
 * start up init code there as well if necessary.
 * 
 * 1. Currently it redirects the user if he is on the "index.html" page
 *    to the maintenance page if he has checked that option.
 *  
 * 2. It also shows a notification that this is a design study.
 * 
 * 3. It checks the login status to the (auto) configured openHAB instance.
 * 
 * 4. All navigation panels (class .autoactive) update their active link class.
 */

import { checkLogin } from './logincheck'
import { Notification } from './notifications'
import { markActiveLinksAfterPageLoad } from './autoactive'
export * from './host'
export * from '../../common/fetch'
export * from './notifications'
import "./serviceworker";
import { nav } from "./asyncPageLoad";

export const version = "w2";

window.toggleContext = (event) => {
  document.querySelector('body').classList.toggle('showcontext');
  event.preventDefault();
}
window.toggleSidebar = (event) => {
  document.querySelector('body').classList.toggle('showsidebar');
  event.preventDefault();
}

function startupAfterDomChanged() {
  if (localStorage.getItem('skiphome') == "true") {
    var hasRedirected = sessionStorage.getItem("redirected");
    if (!hasRedirected) {
      sessionStorage.setItem("redirected", "true");
      if (window.location.pathname === "/index.html") {
        nav.go("maintenance.html");
        return;
      }
    }
  }
  (new Notification('alert-area', "about")).show(`This is a design study.<br><a href="about.html" data-close>About version ${version}</a>`);
  checkLogin().catch(() => { });
  markActiveLinksAfterPageLoad();
}

// Startup
document.addEventListener("DOMContentLoaded", startupAfterDomChanged);
if (['interactive', 'complete'].includes(document.readyState)) startupAfterDomChanged();

export { nav, checkLogin };
