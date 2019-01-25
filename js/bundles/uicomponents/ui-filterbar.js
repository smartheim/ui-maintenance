import { html, render } from 'lit-html';

/**
 * A UI component with a filter bar and a button group "grid"/"list"/"textual".
 * 
 * This is not a shadow-dom component, but still allows children ("slots"). Those
 * are shown when the selection mode is on.
 * 
 * Attributes:
 * - "placeholder": A placeholder for the filter bar
 * - "value": A value for the filter bar
 * - "mode": The current mode. Must be one of "grid","list","textual"
 * - "grid": The tooltip title of the grid button
 * - "list": The tooltip title of the list button
 * - "textual": The tooltip title of the textual button
 * 
 * Events:
 * - "filter": The user clicked on the filter button or hit enter
 */
class UiFilter extends HTMLElement {
  constructor() {
    super();
    this.classList.add("ui-filterbar");
  }
  static get observedAttributes() {
    return ['value'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "value") {
      this.value = this.getAttribute("value") || "";
      this.input.value = this.value;
      this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value, typing: true } }));
    }
  }
  connectedCallback() {
    if (this.hasAttribute("suggestions")) {
      this.suggestionsDomID = Math.random().toString(36);
      var suggestionsEl = document.createElement("datalist");
      suggestionsEl.id = this.suggestionsDomID;
      var items = this.getAttribute("suggestions").split(",");
      for (var item of items) {
        var openEL = document.createElement("option");
        openEL.setAttribute("value", item);
        suggestionsEl.appendChild(openEL);
      }
      document.body.appendChild(suggestionsEl);
    }
    this.placeholder = this.getAttribute("placeholder");
    this.value = this.getAttribute("value") || "";
    this.mode = this.getAttribute("mode") || "grid";
    this.grid = this.getAttribute("grid");
    this.list = this.getAttribute("list");
    this.textual = this.getAttribute("textual");
    this.select = this.getAttribute("select") || "Select";
    this.selectmode = this.getAttribute("selectmode") || false;

    // Non-shadow-dom but still slots magic - Part 1
    var slotElements = [];
    for (var node of this.childNodes) {
      slotElements.push(node.cloneNode(true));
    }
    this.innerHTML = "";

    render(html`
        <form @submit="${this.search.bind(this)}" name="filterform" class="ui-filterbar">
          <button type="button" title="${this.select}" @click="${this.selectChanged.bind(this)}" class="btn ${this.selectmode ? "btn-primary" : "btn-secondary"}">
            <i class="fas fa-check-double"></i>
          </button>
          <div style="display:none" class="selectcomponents"></div>
          <div class="input-group ml-3">
            <input class="form-control py-2 filterinput" type="search" name="filter" placeholder="${this.placeholder}"
              value="${this.value}" @input="${this.searchI.bind(this)}">
            <span class="input-group-append">
              <button class="btn btn-outline-secondary" type="submit">
                <i class="fa fa-search"></i>
              </button>
            </span>
          </div>
          <div class="btn-group ml-3 viewmode" role="group" aria-label="Change view mode"></div></form>
          `, this);

    this.input = this.querySelector("input");

    // Non-shadow-dom but still slots magic - Part 2
    var slot = this.querySelector(".selectcomponents");
    for (var el of slotElements) {
      slot.appendChild(el);
    }

    // Don't show the mode button group if no mode changes allowed
    if (!this.grid && !this.list && !this.textual) {
      this.querySelector(".viewmode").style.display = "none";
    } else
      this.renderViewMode();
  }
  disconnectedCallback() {
    if (this.suggestionsDomID) {
      document.getElementById(this.suggestionsDomID).remove();
      delete this.suggestionsDomID;
    }
  }

  searchI(event) {
    event.preventDefault();
    this.value = event.target.value;
    this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value, typing: true } }));
  }
  search(event) {
    event.preventDefault();
    var formData = new FormData(event.target);
    this.value = formData.get("filter");
    this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value } }));
  }
  modeChange(event) {
    event.preventDefault();
    this.mode = event.target.dataset.mode;
    this.renderViewMode();
    this.dispatchEvent(new CustomEvent('mode', { detail: { mode: this.mode } }));
  }

  selectChanged(event) {
    event.preventDefault();
    this.selectmode = !this.selectmode;
    if (this.selectmode) this.querySelector(".selectcomponents").style.display = "block";
    else this.querySelector(".selectcomponents").style.display = "none";
    this.dispatchEvent(new CustomEvent('selectmode', { detail: { selectmode: this.selectmode } }));
  }
  renderViewMode() {
    render(html`${!this.grid ? '' : html`<button type="button" title="${this.grid}" data-mode="grid" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "grid" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-large"></i></button>`}
          ${!this.list ? '' : html`<button type="button" title="${this.list}" data-mode="list" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "list" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-list"></i></button>`}
          ${!this.textual ? '' : html`<button type="button" title="${this.textual}" data-mode="textual" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "textual" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-align-justify"></i></button>`}
              `, this.querySelector(".viewmode"));
  }
}

customElements.define('ui-filter', UiFilter);
