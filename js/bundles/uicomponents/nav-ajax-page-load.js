/**
 * To avoid flickering of the website-shell, an ajax loading mechanism
 * is used. This is a progressive enhancement and the page works without
 * it as well.
 * 
 * The script only replaces part of the page with the downloaded content.
 * That is:
 * - All styles and scripts linked in the body section
 * - <main>, <footer>, <section.header>, <aside>, <nav> is replaced.
 * - "prev"/"next"/"parent" ref links in <head> are replaced.
 * - A "DOMContentLoaded" event is emitted after loading
 * 
 * A not-found message is shown if loading failed.
 * 
 * A replacement does not happen if the link points to the same page or ("#").
 */

// https://github.com/oom-components/page-loader
import Navigator from './page/navigator';

class NavAjaxPageLoad extends HTMLElement {
    constructor() {
        super();

        this.nav = new Navigator((loader, event) => {
            event.target.classList.add("disabled");
            loader.load()
                .then(page => page.addNewStyles("body"))
                .then(page => this.checkReload(event.target, "aside") ? page.replaceContent('aside') : page)
                .then(page => this.checkReload(event.target, "nav") ? page.replaceContent('body>nav') : page)
                .then(page => page.replaceNavReferences())
                .then(page => page.replaceContent('footer'))
                .then(page => page.replaceContent('section.header'))
                .then(page => page.replaceContent('main', { animationClass: "bouncyFadeOut", duration: 0.7 }))
                .then(page => page.removeOldStyles("body"))
                .then(page => page.replaceScripts("body"))
                .then(() => this.prepareLoadedContent(event))
                .catch(e => { // Connection lost? Check login
                    console.log("Failed to load page:", e.message);
                    document.querySelector("main").innerHTML = `
                  <main class='centered m-4'>
                    <section></section><section class='main card p-4'>Page not found. Are you offline?</section><section></section>
                  </main>
                  `;
                    document.dispatchEvent(new Event('FailedLoading'));
                })
        });
        this.nav.addFilter((el, url) => {
            if (!el.dataset.noReload && new URL(url).pathname == window.location.pathname) return false;
            return true;
        });
    }

    prepareLoadedContent(event) {
        if (event.target) event.target.classList.remove("disabled");
        setTimeout(() => {
            document.dispatchEvent(new Event('DOMContentLoaded'));
        }, 50);
    }

    checkReload(target, section) {
        var d = target.dataset.noReload ? target.dataset.noReload.split(",") : [];
        return !d.includes(section);
    }

    connectedCallback() {
        this.nav.init();

        if (localStorage.getItem('skiphome') != "true") return;
        var hasRedirected = sessionStorage.getItem("redirected");
        if (!hasRedirected) {
            sessionStorage.setItem("redirected", "true");
            if (window.location.pathname === "/index.html") {
                this.nav.go("maintenance.html");
                return;
            }
        }
    }
}

customElements.define('nav-ajax-page-load', NavAjaxPageLoad);