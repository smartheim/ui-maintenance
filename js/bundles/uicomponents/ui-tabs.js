/**
 * A tabbing component. 
 * 
 * Usage:
`<ui-tabs>
  <ul class="nav nav-tabs" slot="links">
    <li class="nav-item"><a class="nav-link" href="#">First tab</a></li>
    <li class="nav-item"><a class="nav-link" href="#">Second tab</a></li>
    <li class="nav-item"><a class="nav-link" href="#">Third tab</a></li>
  </ul>
  <div class="tab-content" slot="tabs">
    <div>First</div>
    <div>Second</div>
    <div>Third</div>
  </div>
</ui-tabs>`
 *
 */
class UiTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  activateTab(index, event = null) {
    if (event) {
      event.preventDefault();
      for (var e of this.links) { e.classList.remove("active") }
      for (var e of this.tabs) { e.style.visibility = "hidden" }
    }
    this.links[index].classList.add("active");
    this.tabs[index].style.visibility = "visible";
  }
  connectedCallback() {
    this.style.display="block";
    this.shadowRoot.innerHTML = `<slot name="links"></slot><slot name="tabs"></slot>`;

    let linkUl = this.shadowRoot.querySelector('slot[name="links"]').assignedNodes()[0];
    this.links = linkUl.querySelectorAll(".nav-link");
    for (var i = 0; i < this.links.length; ++i) {
      const index = i;
      this.links[index].addEventListener("click", (e) => this.activateTab(index, e));
    }

    var tabSlot = this.shadowRoot.querySelector('slot[name="tabs"]').assignedNodes()[0];
    tabSlot.style.display="grid";
    this.tabs = tabSlot.children;
    for (var e of this.tabs) {
      e.style["grid-row-start"] = 1;
      e.style["grid-column-start"] = 1;
      e.style.visibility = "hidden";
    }

    this.activateTab(0);
  }
  disconnectedCallback() {
  }
}

customElements.define('ui-tabs', UiTabs);
