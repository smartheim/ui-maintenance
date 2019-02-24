import { html, render } from 'lit-html';

/**
 * @category Web Components
 * @customelement ui-filter
 * @description 
 * A UI component with a filter bar and a button group "grid"/"list"/"textual".
 * 
 * This is not a shadow-dom component, but still allows children ("slots"). Those
 * are shown when the selection mode is on.
 * 
 * Attributes:
 * 
 * - "placeholder": A placeholder for the filter bar
 * - "value": A value for the filter bar
 * - "mode": The current mode. Must be one of "grid","list","textual"
 * - "grid": The tooltip title of the grid button
 * - "list": The tooltip title of the list button
 * - "textual": The tooltip title of the textual button
 * 
 * Events:
 * 
 * - "filter": The user clicked on the filter button or hit enter
 * 
 * @example <caption>Import an image, name it minnie.</caption>
 * <ui-filter src="#minnie" name="minnie" index="1"></ui-filter>
 */
class UiFilterBar extends HTMLElement {
  constructor() {
    super();
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
    this.classList.add("ui-filterbar");
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
    this.select = this.getAttribute("select");
    this.selectmode = this.getAttribute("selectmode") || false;

    // Non-shadow-dom but still slots magic - Part 1
    var slotElements = [];
    for (var node of this.childNodes) {
      slotElements.push(node.cloneNode(true));
    }
    while (this.firstChild) { this.firstChild.remove(); }

    render(html`
        <form @submit="${this.search.bind(this)}" class="ui-filterbar">
        ${!this.select ? '' : html`<button type="button" title="${this.select}" @click="${this.selectChanged.bind(this)}" class="selectbtn mr-3 btn ${this.selectmode ? "btn-primary" : "btn-secondary"}">
            <i class="fas fa-check-double"></i>
          </button>
          <div class="hidden selectcomponents mr-3"></div>
          `}
          <div class="input-group">
            <input class="form-control py-2 filterinput" type="search" name="filter" placeholder="${this.placeholder}"
              value="${this.value}" @input="${this.searchI.bind(this)}">
            <span class="input-group-append">
              <button class="btn btn-outline-secondary btn-outline-visible" type="submit">
                <i class="fa fa-search"></i>
              </button>
            </span>
          </div>
          <div class="btn-group ml-3 viewmode" role="group" aria-label="Change view mode"></div>
        </form>
        <div class="ui-editorbar">
          <span class="editorHintMessage"></span>
          <div class="ml-auto btn-group" role="group" aria-label="Editor bar">
            <button class="btn btn-success" @click="${this.editorSave.bind(this)}">Submit</button>
            <button class="btn btn-danger" @click="${this.editorDiscard.bind(this)}">Discard</button>
          </div>
        </div>
        `, this);

    this.input = this.querySelector("input");
    this.filterbar = this.querySelector(".ui-filterbar");
    this.editorbar = this.querySelector(".ui-editorbar");
    this.selectbtn = this.querySelector(".selectbtn");
    this.selectcomponents = this.querySelector(".selectcomponents");
    this.editorHintMessage = this.querySelector(".editorHintMessage");

    this.editorbar.classList.add("hidden");

    // Non-shadow-dom but still slots magic - Part 2
    if (slotElements.length) {
      var slot = this.selectcomponents;

      for (var el of slotElements) {
        slot.appendChild(el);
      }

      // Wire up all buttons that have a data-action to dispatch an event
      // This is for the selection mode only.
      slot.querySelectorAll("*[data-action]").forEach(button => {
        button.addEventListener("click", e => {
          e.preventDefault();
          const action = e.target.dataset.action;
          this.dispatchEvent(new CustomEvent('selection', { detail: { action } }));
        });
      });
    }

    // Don't show the mode button group if no mode changes allowed
    if (!this.grid && !this.list && !this.textual) {
      this.querySelector(".viewmode").classList.add("hidden");
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
    if (this.mode == "textual") {
      this.selectmode = false;
      this.selectbtn.classList.add("hidden");
    } else {
      this.selectbtn.classList.remove("hidden");
    }
  }
  setEditorContentChanged(val, message = "") {
    if (val) {
      this.editorHintMessage.innerHTML = message;
      this.editorbar.classList.remove("hidden");
      this.filterbar.classList.add("hidden");
    } else {
      this.editorbar.classList.add("hidden");
      this.filterbar.classList.remove("hidden");
    }
  }
  editorSave() {
    this.dispatchEvent(new CustomEvent('editor', { detail: { save: true } }));
  }
  editorDiscard() {
    this.dispatchEvent(new CustomEvent('editor', { detail: { discard: true } }));
  }

  selectChanged(event) {
    event.preventDefault();
    this.selectmode = !this.selectmode;
    if (this.selectmode)
      this.selectcomponents.classList.remove("hidden");
    else
      this.selectcomponents.classList.add("hidden");
    this.dispatchEvent(new CustomEvent('selection', { detail: { selectmode: this.selectmode } }));
  }
  renderViewMode() {
    render(html`${!this.grid ? '' : html`<button type="button" title="${this.grid} (Alt+g)" accesskey="g" data-mode="grid" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "grid" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-large"></i></button>`}
          ${!this.list ? '' : html`<button type="button" title="${this.list} (Alt+l)" data-mode="list" accesskey="l" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "list" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-list"></i></button>`}
          ${!this.textual ? '' : html`<button type="button" title="${this.textual} (Alt+t)" data-mode="textual" accesskey="t" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "textual" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-align-justify"></i></button>`}
              `, this.querySelector(".viewmode"));
  }
}

customElements.define('ui-filter', UiFilterBar);
