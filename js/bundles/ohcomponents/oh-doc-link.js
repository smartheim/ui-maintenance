/**
 * This is a tandem component for oh-context-help.
 * Usage: <a href="#" data-doc="some-link-to-markdown" is="oh-doc-link">Documentation</a>
 */
class OhDocLink extends HTMLAnchorElement {
  constructor() {
    super();
    this.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector('body').classList.add('showcontext');
      var el = document.querySelector("oh-context-help");
      if (!el) return;
      el.temporaryurl = this.href;
    });
  }
}

customElements.define('oh-doc-link', OhDocLink, { extends: "a" });