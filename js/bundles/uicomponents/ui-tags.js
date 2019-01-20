import { html, render } from 'lit-html';

class UiTags extends HTMLElement {
    constructor() {
        super();
        this.tags = [];
    }
    connectedCallback() {
        this.classList.add("ui-tags");
        if (this.hasAttribute("suggestions")) {
            this.suggestionsDomID = Math.random().toString(36);
            var suggestionsEl = document.createElement("datalist");
            suggestionsEl.id = this.suggestionsDomID;
            var items =  this.getAttribute("suggestions").split(",");
            for (var item of items) {
                var openEL = document.createElement("option");
                openEL.setAttribute("value", item);
                suggestionsEl.appendChild(openEL);
            }
            document.body.appendChild(suggestionsEl);
        }
        this.render();
    }
    disconnectedCallback() {
        if (this.suggestionsDomID) {
            document.getElementById(this.suggestionsDomID).remove();
            delete this.suggestionsDomID;
        }
    }
    set value(val) {
        if (!Array.isArray(val)) {
            this.tags = val ? val.split(",") : [];
        } else
            this.tags = val.slice();
        this.render();
    }
    get value() {
        return this.tags;
    }
    addTag(sourceInput) {
        const tagname = sourceInput.value;
        if (!tagname || !tagname.length || this.tags.includes(tagname)) return;
        console.log("addTag", tagname);
        sourceInput.value = '';
        this.tags.push(tagname);
        this.render();
        setTimeout(() => sourceInput.focus(), 50);
        this.dispatchEvent(new Event("input"));
    }
    removeTag(tagname,e) {
        if (e) e.preventDefault();
        this.tags = this.tags.filter(t => t != tagname);
        console.log("remove", tagname, this.tags);
        this.render();
        this.dispatchEvent(new Event("input"));
    }
    inputKey(event) {
        if (event.key == 'Enter') {
            event.preventDefault();
            this.addTag(event.target);
        }
    }
    render() {
        const tagsEl = this.tags.map((tag) =>
            html`<div class="ui-tag-list"><span>${tag}</span>
                <button @click="${(e) => this.removeTag(tag,e)}" class="btn btn-danger-hover p-0"><i class="fas fa-times"></i></button>
            </div>`
        );
        render(html`${tagsEl}<div style="min-width:120px"><div class="ui-tags-add btn btn-success-hover p-0">
                <i class="fas fa-plus" @click=${(event) => this.addTag(event.target.nextElementSibling)}></i>
                <input list="${this.suggestionsDomID}" placeholder="Add" oninput="event.stopPropagation()"
                    @keypress="${(event) => this.inputKey(event)}">
            </div></div>`, this);
    }
}

customElements.define('ui-tags', UiTags);