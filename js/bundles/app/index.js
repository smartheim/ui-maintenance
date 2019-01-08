import Navigator from './page/navigator';
import { register } from 'register-service-worker'
import { checkLogin } from './logincheck'
import { Notification } from './notifications'
export * from './host'
export * from '../../common/fetch'
export * from './notifications'

// Service worker for caching
register('./sw.js', {
  offline() {
    console.log('No internet connection found. App is running in offline mode.')
  },
  error(error) {
    console.error('Error during service worker registration:', error)
  }
})

export function defaultStartPage() {
  return localStorage.getItem('skiphome') == "true" ? "maintenance.html" : null
}

function prepareLoadedContent(event) {
  if (event.target) event.target.classList.remove("disabled");
  setTimeout(() => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }, 50);
}

function checkReload(target, section) {
  var d = target.dataset.noReload ? target.dataset.noReload.split(",") : [];
  return !d.includes(section);
}

window.toggleContext = (event) => {
  document.querySelector('body').classList.toggle('showcontext');
  event.preventDefault();
}
window.toggleSidebar = (event) => {
  document.querySelector('body').classList.toggle('showsidebar');
  event.preventDefault();
}

// Ajax page reload, to keep the redux state stores if possible
// https://github.com/oom-components/page-loader
const nav = new Navigator((loader, event) => {
  event.target.classList.add("disabled");
  loader.load()
    .then(page => page.replaceStyles("body"))
    .then(page => page.replaceScripts("body"))
    .then(page => page.replaceContent('main').replaceContent('footer').replaceContent('section.header').replaceNavReferences())
    .then(page => checkReload(event.target, "aside") ? page.replaceContent('aside') : page)
    .then(page => checkReload(event.target, "nav") ? page.replaceContent('body>nav') : page)
    .then(() => prepareLoadedContent(event))
    .catch(e => { // Connection lost? Check login
      console.log("Failed to load page:", e.message);
      document.querySelector("main").innerHTML = `
        <main class='centered'>
          <section></section><section class='main card p-4'>Page not found. Are you offline?</section><section></section>
        </main>
        `;
      checkLogin(true).catch(() => { });
    })
});
nav.addFilter((el, url) => {
  if (new URL(url).pathname == window.location.pathname) return false;
  return true;
});
nav.init();

function startupAfterDomChanged() {
  (new Notification('alert-area', "about")).show(`This is a design study.<br><a href="about.html" data-close>About</a>`);
  checkLogin().catch(() => { });
  var hasRedirected = sessionStorage.getItem("redirected");
  if (!hasRedirected) {
    sessionStorage.setItem("redirected", "true");
    if (window.location.pathname === "/index.html") {
      nav.go("maintenance.html");
    }
  }
}

// Startup
document.addEventListener("DOMContentLoaded", startupAfterDomChanged);
if (['interactive', 'complete'].includes(document.readyState)) startupAfterDomChanged();

export function markActiveLinkAfterPageLoad(id, handler) {
  var elem = document.getElementById(id);
  if (!elem) {
    document.removeEventListener("DOMContentLoaded", handler);
    return;
  }

  var c = elem.children;
  for (var i = 0; i < c.length; i++) {
    var link = c[i].children[0];
    const classlist = link.classList;
    classlist.remove("active");
    if (new URL(link.href).pathname == window.location.pathname)
      classlist.add("active");
  }
}

export { nav, checkLogin };
