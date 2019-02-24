/**
 * Update the "active" class for child links, depending on the current page url.
 */
class UiNavAutoLink extends HTMLElement {
  constructor() {
    super();
    this.pageChangedBound = () => this.checkLinks();
    document.addEventListener("DOMContentLoaded", this.pageChangedBound);
  }
  disconnectedCallback() {
    document.removeEventListener("DOMContentLoaded", this.pageChangedBound);
  }
  connectedCallback() {
    this.style.display = "none";
    this.checkLinks();
  }
  checkLinks() {
    var parentlink = document.querySelector('link[rel="parent"]');
    if (parentlink) parentlink = parentlink.href;

    var elems = this.parentNode.children;
    for (var elem of elems) {
      if (elem == this) continue;
      var link = elem.children[0];
      if (!link.href) continue;
      const classlist = link.classList;
      classlist.remove("active");
      classlist.remove("semiactive");
      const url = new URL(link.href);
      if (url.pathname == window.location.pathname && url.search == window.location.search)
        classlist.add("active");
      else if (link.href == parentlink)
        classlist.add("semiactive");
    }
  }
}

customElements.define('ui-nav-auto-link', UiNavAutoLink);