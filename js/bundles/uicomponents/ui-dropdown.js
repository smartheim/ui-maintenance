import { html, render } from 'lit-html';

class UiDropdown extends HTMLElement {
    constructor() {
        super();
        this.options = {};
        this.isShown = false;
    }
    connectedCallback() {
        if (!Object.keys(this.options).length && this.hasAttribute("options")) {
            var items = this.getAttribute("options").split(",");
            for (var item of items) this.options[item] = item;
        }
        this.icons = this.hasAttribute("icons") ? this.getAttribute("icons") : null;
        this.novalue = this.hasAttribute("novalue");
        this.classes = this.hasAttribute("btnclass") ? this.getAttribute("btnclass") : "btn btn-primary-hover btn-sm";
        this.bodyClickBound = () => this.close();
        this.addEventListener("click", e => e.stopPropagation());
        this.classList.add("dropdown");
        this.attributeChangedCallback();
        this.render();
    }
    static get observedAttributes() {
        return ['value'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.value = this.hasAttribute("value") ? this.getAttribute("value") : this.value;
    }
    toggleShow() {
        if (this.isShown) this.close(); else this.open();
    }
    close() {
        this.isShown = false;
        document.body.removeEventListener("click", this.bodyClickBound);
        this.render();
    }
    open() {
        this.isShown = true;
        document.body.addEventListener("click", this.bodyClickBound);
        this.render();
    }
    select(key) {
        this.close();

        if (this.novalue) {
            this.dispatchEvent(new CustomEvent("input", { detail: key }));
            return;
        }
        this.value = key;
        this.dispatchEvent(new Event("input"));
        this.render();
    }
    render() {
        const optionEls = Object.keys(this.options).map(key =>
            html`<a @click=${(event) => this.select(event.target.dataset.key)}
                class="dropdown-item ${this.value == key ? 'active' : ''}" href="#" data-key=${key}>
                <div style="pointer-events: none">
                    ${this.icons ? html`<img style="float:left;width:40px;max-height:40px;margin-right:10px;" src="img/${this.icons}/${key}.png">` : ''}
                    ${key}<br><small>${this.options[key]}</small>
                </div>
            </a>`
        );
        render(html`
        <button class="${this.classes} dropdown-toggle" type="button" data-toggle="dropdown"
            aria-haspopup="true" aria-expanded="false" @click=${this.toggleShow.bind(this)}>
          ${this.value}
        </button>
        <div class="dropdown-menu ${this.isShown ? 'show' : ''}">
          ${optionEls}
        </div>`, this);
    }
}

customElements.define('ui-dropdown', UiDropdown);