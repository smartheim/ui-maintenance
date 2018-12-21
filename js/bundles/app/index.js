import Navigator from '@oom/page-loader';
import { register } from 'register-service-worker'
import { checkLogin } from './logincheck'

// Service worker for caching
register('./js/sw.js', {
  offline() {
    console.log('No internet connection found. App is running in offline mode.')
  },
  error(error) {
    console.error('Error during service worker registration:', error)
  }
})

function prepareLoadedContent() {
  const main = document.querySelector("main");
  setTimeout(() => {
    main.classList.remove("d-none")
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }, 50);
}

// Ajax page reload, to keep the redux state stores if possible
// https://github.com/oom-components/page-loader
const nav = new Navigator((loader, event) =>
  loader.load()
    .then(page => { document.querySelector("main").classList.add("swingout"); return page; })
    .then(page => page.replaceStyles())
    .then(page => page.replaceScripts())
    .then(page => page.replaceContent('main', main => main.classList.add("d-none")))
    .then(() => prepareLoadedContent())
);
nav.init();

checkLogin();

export { nav };