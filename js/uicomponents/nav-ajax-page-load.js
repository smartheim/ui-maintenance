import Navigator from '../_page';

/**
 * @category Web Components
 * @customelement nav-ajax-page-load
 * @description 
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
 * 
 * @see https://github.com/oom-components/page-loader
 * @example <caption>An example</caption>
 * <nav-ajax-page-load></nav-ajax-page-load>
 */
class NavAjaxPageLoad extends HTMLElement {
  constructor() {
    super();

    this.nav = new Navigator((loader, event) => {
      if (event && event.target && event.target.classList)
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
          console.log("Failed to load page:", e);
          document.querySelector("main").innerHTML = `
<main class='centered m-4'>
  <section class='card p-4'>
    <h4>Error loading the page ☹</h4>
    ${e.message ? e.message : e}
  </section>
</main>
`;
          document.dispatchEvent(new Event('FailedLoading'));
        })
    });

    // Perform default action if clicking on a same page link where only the hash differs.
    // Required for anchor links
    this.nav.addFilter((el, url) => ((el && el.dataset && !el.dataset.noReload) && new URL(url).pathname == window.location.pathname));

    // Abort page request on demand
    this.nav.addFilter((el, url) => {
      if (this.hasUnsavedChanges) {
        const r = window.confirm("You have unsaved changes. Dismiss them?");
        if (r) this.hasUnsavedChanges = false;
        return r ? false : null; // Perform a normal xhr page replacement or abort the request
      }
      return false;
    });

    this.boundUnsavedChanges = (event) => {
      this.hasUnsavedChanges = event.detail;
      window.removeEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
      if (this.hasUnsavedChanges) window.addEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
    }
    this.boundBeforeUnload = (event) => {
      if (this.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes which will not be saved.';
        return event.returnValue;
      }
    }
  }

  prepareLoadedContent(event) {
    if (event.target && event.target.classList) event.target.classList.remove("disabled");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 50);
  }

  checkReload(target, section) {
    const d = (target && target.dataset && target.dataset.noReload) ? target.dataset.noReload.split(",") : [];
    return !d.includes(section);
  }

  connectedCallback() {
    this.nav.init();

    document.addEventListener("unsavedchanges", this.boundUnsavedChanges, { passive: true });

    if (localStorage.getItem('skiphome') != "true") return;
    const hasRedirected = sessionStorage.getItem("redirected");
    if (!hasRedirected) {
      sessionStorage.setItem("redirected", "true");
      if (window.location.pathname === "/index.html") {
        this.nav.go("maintenance.html");
        return;
      }
    }
  }
  disconnectedCallback() {
    document.removeEventListener("unsavedchanges", this.boundUnsavedChanges, { passive: true });
    window.removeEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
  }
}

customElements.define('nav-ajax-page-load', NavAjaxPageLoad);