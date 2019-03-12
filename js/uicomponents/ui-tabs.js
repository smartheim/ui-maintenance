/**
 * @category Web Components
 * @customelement ui-tabs
 * @description A tabbing component. 
 * 
 * @example <caption>An example</caption>
 * <ui-tabs>
  <ul class="nav nav-tabs" slot="links">
    <li class="nav-item"><a class="navlink" href="#">First tab</a></li>
    <li class="nav-item"><a class="navlink" href="#">Second tab</a></li>
    <li class="nav-item"><a class="navlink" href="#">Third tab</a></li>
  </ul>
  <div class="tab-content" slot="tabs">
    <div>First</div>
    <div>Second</div>
    <div>Third</div>
  </div>
</ui-tabs>
 */
class UiTabs extends HTMLElement {
  constructor() {
    super();
    this.last = -1;
    this._active = 0;
    this.attachShadow({ mode: 'open' });
  }
  set activetab(val) {
    if (!this.tabs) {
      this._active = val;
      return;
    }
    if (!Number.isInteger(val)) return;
    if (this.last != -1) {
      if (this.links) this.links[this.last].classList.remove("active");
      this.tabs[this.last].style.visibility = "hidden";
    }
    this.last = val;
    if (this.links) this.links[val].classList.add("active");
    this.tabs[val].style.visibility = "visible";
  }
  connectedCallback() {
    if (this.hasAttribute("upsidedown"))
      this.shadowRoot.innerHTML = `<style>:host{display:block}</style><slot name="tabs"></slot><slot name="links"></slot>`;
    else
      this.shadowRoot.innerHTML = `<style>:host{display:block}</style><slot name="links"></slot><slot name="tabs"></slot>`;

    let linkUl = this.shadowRoot.querySelector('slot[name="links"]').assignedNodes()[0];
    if (linkUl) {
      this.links = linkUl.querySelectorAll(".navlink");
      for (let i = 0; i < this.links.length; ++i) {
        const index = i;
        this.links[index].addEventListener("click", (e) => (e.preventDefault(), this.activateTab(index)));
      }
    }

    const tabSlot = this.shadowRoot.querySelector('slot[name="tabs"]').assignedNodes()[0];
    tabSlot.style.display = "grid";
    this.tabs = tabSlot.children;
    for (let e of this.tabs) {
      e.style["grid-row-start"] = 1;
      e.style["grid-column-start"] = 1;
      e.style.visibility = "hidden";
    }

    this.activetab = this._active;
  }
  disconnectedCallback() {
  }
}

customElements.define('ui-tabs', UiTabs);
