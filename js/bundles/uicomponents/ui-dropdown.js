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
    }
    connectedCallback() {
        if (this.hasAttribute("viewkey")) this.viewkey = this.getAttribute("viewkey");
        if (this.hasAttribute("desckey")) this.desckey = this.getAttribute("desckey");
        if (this.hasAttribute("valuekey")) this.valuekey = this.getAttribute("valuekey");
        this.novalue = this.hasAttribute("novalue");
        this.nostate = this.hasAttribute("nostate");
        this.icons = this.hasAttribute("icons") ? this.getAttribute("icons") : null;

        this.bodyClickBound = (e) => this.bodyClicked(e);
        this.addEventListener("click", e => e.stopPropagation());
        this.classList.add("dropdown");
        const classes = this.hasAttribute("btnclass") ? this.getAttribute("btnclass") : "btn btn-primary-hover btn-sm";
        render(html`
        <button class="${classes} dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false"
            @click=${this.toggleShow.bind(this)}>
          <span class="label"></span>
        </button>
        <div class="dropdown-menu"></div>`, this);
        this.dropdownEl = this.querySelector(".dropdown-menu");
        this.labelEl = this.querySelector(".label");
        if (this.hasAttribute("label")) this.labelEl.innerHTML = this.getAttribute("label");

        if (this._options) this.options = this._options;
        if (this._value) this.value = this._value;
        if (this.hasAttribute("options")) this.attributeChangedCallback("options");
        if (this.hasAttribute("value")) this.attributeChangedCallback("value");
    }
    static get observedAttributes() {
        return ['value'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "value") this.value = this.getAttribute("value");
        if (name == "options") {
            var options = {};
            var items = this.getAttribute("options").split(",");
            for (var item of items) {
                const data = item.split(":");
                if (data.length == 1) options[item] = { label: item };
                else options[data[0].trim()] = { label: data[1].trim() };
            }
            this.options = options;
        }
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
        if (!this.novalue && this._options && this._options[key]) {
            this.labelEl.innerHTML = this._options[key].label;
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
    get options() {
        return this._options;
    }
    // We allow arrays as well as object(key:{label,desc}) mappings
    set options(newValue) {
        this._options = newValue;
        if (!this.dropdownEl) return;

        if (Array.isArray(newValue)) {
            if (!this.viewkey || !this.valuekey) {
                console.warn("No viewkey/valuekey set!");
                return;
            }
            var options = {};
            for (let entry of newValue) {
                const key = entry[this.valuekey];
                const label = entry[this.viewkey];
                const desc = entry[this.desckey];
                options[key] = { label, desc };
            }
            newValue = options;
        }
        this._options = newValue;

        while (this.dropdownEl.firstChild) { this.dropdownEl.firstChild.remove(); }
        for (var key of Object.keys(this._options)) {
            const option = this._options[key];
            const a = document.createElement("a");
            a.href = "#";
            a.classList.add("dropdown-item");
            a.dataset.key = key;
            a.addEventListener("click", (event) => this.select(event.target.dataset.key, event));
            let img = this.icons ? `<img src="img/${this.icons}/${key}.png">` : "";
            if (option.desc)
                a.innerHTML = `<div>${img}<b>${option.label}</b><br><small>${option.desc}</small></div>`;
            else
                a.innerHTML = `<div>${img}${option.label}</div>`;
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