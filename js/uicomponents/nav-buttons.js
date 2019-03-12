/**
 * @category Web Components
 * @customelement nav-buttons
 * @description Prev/Next navigation buttons
 * 
 * @example <caption>An example</caption>
 * <nav-buttons></nav-buttons>
 */
class NavButtons extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "block";
    this.prevLink = this.hasAttribute("prevLink") ? this.getAttribute("prevLink") : null;
    this.nextLink = this.hasAttribute("nextLink") ? this.getAttribute("nextLink") : null;

    if (!this.prevLink) {
      const link = document.querySelector('link[rel="prev"]');
      if (link) this.prevLink = link.href;
      else this.prevLink = "";
    }

    if (!this.nextLink) {
      const link = document.querySelector('link[rel="next"]');
      if (link) this.nextLink = link.href;
      else this.nextLink = "";
    }

    this.prevEnabled = this.prevLink != "";
    this.nextEnabled = this.nextLink != "";

    while (this.firstChild) { this.firstChild.remove(); }

    this.innerHTML = `
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${this.prevEnabled ? "" : "disabled"}" href="${this.prevLink}">Back</a>
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${this.nextEnabled ? "" : "disabled"}" href="${this.nextLink}">Next</a>`;
  }
}

customElements.define('nav-buttons', NavButtons);
