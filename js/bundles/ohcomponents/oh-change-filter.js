/**
 * This is a tandem component for ui-filterbar and ui-vue-list-bind
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
    this.sort = this.hasAttribute("sort") ? this.getAttribute("sort") : null;
    this.direction = this.hasAttribute("direction") ? this.getAttribute("direction") : null;
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

    if (this.filter) el.setAttribute("value", this.filter);
    if (this.sort) el.sort(this.sort, this.direction);
  }
}

customElements.define('oh-change-filter', OhChangeFilter);
