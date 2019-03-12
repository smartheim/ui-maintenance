/**
 * @category Data Components
 * @memberof module:ohcomponents
 * @customelement oh-nav-auto-link
 * @description Update the "active" class for sibling child links, depending on the current page url.

 * @example <caption>Usage</caption>
 * <nav>
 * <oh-nav-auto-link></oh-nav-auto-link>
    <div><a id="navmaintenance" href="maintenance.html">Maintenance</a></div>
    <div><a id="navbindings" href="bindings.html">Add-ons</a></div>
 * </nav>
 */
class OhNavAutoLink extends HTMLElement {
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
  /**
   * Checks the sibling links if they need the "active" class (depending on the 'href' attribute).
   * This method is automatically called on every "DOMContentLoaded" event.
   */
  checkLinks() {
    let parentlink = document.querySelector('link[rel="parent"]');
    if (parentlink) parentlink = parentlink.href;

    const elems = this.parentNode.children;
    for (let elem of elems) {
      if (elem == this) continue;
      const link = elem.children[0];
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

customElements.define('oh-nav-auto-link', OhNavAutoLink);