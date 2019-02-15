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
        this.editable = this.hasAttribute("editable");
        this.novalue = this.hasAttribute("novalue");
        this.nostate = this.hasAttribute("nostate");
        this.icons = this.hasAttribute("icons") ? this.getAttribute("icons") : null;

        this.bodyClickBound = (e) => this.bodyClicked(e);
        this.addEventListener("click", e => e.stopPropagation());
        this.classList.add("dropdown");
        const classes = this.hasAttribute("btnclass") ? this.getAttribute("btnclass") : "btn btn-primary-hover btn-sm";

        let controlChild = null;
        if (this.firstElementChild == null) {
            controlChild = document.createElement("div");
            if (this.editable) {
                render(html`
            <input class="${classes} dropdown-toggle label" aria-haspopup="true" aria-expanded="false">`, controlChild);
            } else {
                render(html`
            <button class="${classes} dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false"><span class="label"></span></button>`, controlChild);
            }
            controlChild = this.appendChild(controlChild.firstElementChild)
        } else {
            controlChild = this.firstElementChild;
        }
        controlChild.addEventListener("click", this.toggleShow.bind(this));

        const el = document.createElement("div"); el.classList.add("dropdown-menu");
        this.dropdownEl = this.appendChild(el);
        this.labelEl = this.querySelector(".label");
        if (!this.labelEl) throw new Error("Render failed");

        if (this._options) this.options = this._options;
        if (this.hasAttribute("options")) this.attributeChangedCallback("options");
        if (this.hasAttribute("value"))
            this.attributeChangedCallback("value");
        else
            this.value = this._value;
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

        this._value = key;
        if (!this.dropdownEl) return;

        if (key == null || key == undefined || key == "" || !this._options) {
            if (this.editable) {
                this.labelEl.placeholder = this.getAttribute("label");
                this.labelEl.value = "";
            } else
                this.labelEl.innerHTML = this.getAttribute("label");
            return;
        }

        if (!this.novalue && this._options && this._options[key]) {
            const option = this._options[key];
            if (this.editable)
                this.labelEl.value = option.label;
            else
                this.labelEl.innerHTML = option.label;
            this.labelEl.title = option.desc || "";
        }
        this._value = key;
        // Change active marker
        var selectedEl = this.dropdownEl.querySelector(".active");
        if (selectedEl) selectedEl.classList.remove("active");
        selectedEl = this.dropdownEl.querySelector("a[data-key='" + key + "']");
        if (selectedEl) selectedEl.classList.add("active");
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
                a.innerHTML = `${img}<div><b>${option.label}</b><br><div class="small">${option.desc}</div></div>`;
            else
                a.innerHTML = `${img}<div>${option.label}</div>`;
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