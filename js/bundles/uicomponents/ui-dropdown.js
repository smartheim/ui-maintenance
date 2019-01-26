import { html, render } from 'lit-html';

/**
 * A dropdown component.
 * 
 * Events:
 * - "input": The value has changed
 * 
 * Attributes:
 * - "novalue": Will not apply the selected entry as new value, only emits an input event
 */
class UiDropdown extends HTMLElement {
    constructor() {
        super();
        this._options = {};
    }
    connectedCallback() {
        this.novalue = this.hasAttribute("novalue");
        this.nostate = this.hasAttribute("nostate");
        this.icons = this.hasAttribute("icons") ? this.getAttribute("icons") : null;
        const classes = this.hasAttribute("btnclass") ? this.getAttribute("btnclass") : "btn btn-primary-hover btn-sm";
        this.bodyClickBound = (e) => this.bodyClicked(e);
        this.addEventListener("click", e => e.stopPropagation());
        this.classList.add("dropdown");
        if (!Object.keys(this._options).length && this.hasAttribute("options")) {
            var items = this.getAttribute("options").split(",");
            for (var item of items) {
                const data = item.split(":");
                if (data.length == 1) this._options[item] = item;
                else this._options[data[0].trim()] = data[1].trim();
            }
        }
        render(html`
        <button class="${classes} dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false"
            @click=${this.toggleShow.bind(this)}>
          <span class="label"></span>
        </button>
        <div class="dropdown-menu"></div>`, this);
        this.dropdownEl = this.querySelector(".dropdown-menu");
        this.labelEl = this.querySelector(".label");
        this.options = this._options; // will call the setter which renders the options
        if (this.hasAttribute("label")) this.labelEl.innerHTML = this.getAttribute("label");
        this.value = this.hasAttribute("value") ? this.getAttribute("value") : null; // calls the setter
    }
    static get observedAttributes() {
        return ['value'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "value") this.value = this.getAttribute("value");
    }
    toggleShow() {
        if (this.dropdownEl.classList.contains("show")) this.close(); else this.open();
    }
    bodyClicked(e) {
        this.closeTimer = setTimeout(() => this.close(), 50);
    }
    close() {
        this.dropdownEl.classList.remove("show");
    }
    open() {
        if (this.closeTimer) { clearTimeout(this.closeTimer); delete this.closeTimer; }
        document.body.addEventListener("click", this.bodyClickBound, { once: true, passive: true, capture: true });
        this.dropdownEl.classList.add("show");
    }
    set value(key) {
        if (!this.novalue && this._options[key]) {
            this.labelEl.innerHTML = this._options[key];
        }
        this._value = key;
        if (this.dropdownEl) {
            // Change active marker
            var selectedEl = this.dropdownEl.querySelector(".active");
            if (selectedEl) selectedEl.classList.remove("active");
            selectedEl = this.dropdownEl.querySelector("a[data-key='" + key + "']");
            if (selectedEl) selectedEl.classList.add("active");
        }
    }
    get value() {
        return this._value;
    }
    set options(newValue) {
        this._options = newValue;
        if (!this.dropdownEl) return;

        while (this.dropdownEl.firstChild) { this.dropdownEl.firstChild.remove(); }
        for (var key of Object.keys(this._options)) {
            const a = document.createElement("a");
            a.href = "#";
            a.classList.add("dropdown-item");
            a.dataset.key = key;
            a.addEventListener("click", (event) => this.select(event.target.dataset.key, event));
            if (this.icons)
                a.innerHTML = `<div><img src="img/${this.icons}/${key}.png">${this._options[key]}</div>`;
            else
                a.innerHTML = `<div>${this._options[key]}</div>`;
            this.dropdownEl.appendChild(a);
        }

        this.value = this._value;
    }
    select(key, event) {
        if (event) event.preventDefault();
        this.dropdownEl.classList.remove("show");
        document.body.removeEventListener("click", this.bodyClickBound, { once: true, passive: true, capture: true });
        if (!this.nostate) this.value = key;
        this.dispatchEvent(new CustomEvent("input", { detail: key }));
    }
}

customElements.define('ui-dropdown', UiDropdown);