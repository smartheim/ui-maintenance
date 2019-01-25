/**
 * This is a tandem component for ui-filterbar.
 * 
 */
class OhChangeFilter extends HTMLElement {
  constructor() {
    super();
    this.classList.add("link");
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : null;
    this.filter = this.hasAttribute("filter") ? this.getAttribute("filter") : null;
  }
  connectedCallback() {
    this.attributeChangedCallback();
    this.onclick = (e) => this.clickListener(e);
  }
  clickListener(e) {
    e.preventDefault();
    e.stopPropagation();
    var el = document.querySelector(this.target);
    if (!el) {
      console.warn("Did not find target element: ", this.target);
      return;
    }

    el.setAttribute("value", this.filter);
  }
}

customElements.define('oh-change-filter', OhChangeFilter);
