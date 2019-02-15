import style from './ui-multiselect.scss';
import { html, render } from 'lit-html';

/**
 * TODO: Convert to lit-html web-component
 */
class UImultiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selected = {};
        this.items = [];
    }
    connectedCallback() {
        this._options = {
            placeholder: this.getAttribute("placeholder") || 'Select'
        };
        if (this.hasAttribute("viewkey")) this.viewkey = this.getAttribute("viewkey");
        if (this.hasAttribute("desckey")) this.desckey = this.getAttribute("desckey");
        if (this.hasAttribute("valuekey")) this.valuekey = this.getAttribute("valuekey");
        render(html`<style>${style}</style>
        <slot><input></slot>
        <div class="multiselect-popup">
            <ul class="multiselect-list" role="listbox" aria-multiselectable="true"></ul>
        </div>
        `, this.shadowRoot);

        let slot = this.shadowRoot.querySelector('slot').assignedNodes();
        let input = (slot.length > 0) ? slot[0] : this.shadowRoot.querySelector('input');
        if (this.hasAttribute("required")) input.setAttribute("required", "required");
        input.style.color = "transparent";
        input.style.height = "initial";
        input.addEventListener("click", e => e.preventDefault());
        input.setAttribute("autocomplete", "off");
        this.input = input;
        this.style.height = "initial";
        this._field = this.shadowRoot;
        this._popup = this.shadowRoot.querySelector('.multiselect-popup');
        this._list = this.shadowRoot.querySelector('.multiselect-list');

        this.fieldClickHandlerBound = e => this.fieldClickHandler(e);
        this.shadowRoot.addEventListener('click', this.fieldClickHandlerBound);
        this.shadowRoot.addEventListener('keydown', this.keyDownHandler.bind(this));

        this._field.appendChild(this.createPlaceholder());

        if (this.hasAttribute("options")) {
            this.items = this.getAttribute("options").split(",").map(e => { return { "id": e, "label": e } });
            this.renderOptionsList();
        } else if (this.cachedOptions) {
            this.options = this.cachedOptions;
            delete this.cachedOptions;
        }

        if (this.cachedValue) {
            this.value = this.cachedValue;
            delete this.cachedValue;
        }
    }
    disconnectedCallback() {
        this.shadowRoot.removeEventListener('click', this.fieldClickHandlerBound);
    }
    attributeChangedCallback(optionName, oldValue, newValue) {
        this._options[optionName] = newValue;
        if (optionName == "options") this.renderOptionsList();
    };
    set options(newValue) {
        if (!this._list) {
            this.cachedOptions = newValue;
            return;
        }
        if (!this.viewkey || !this.valuekey) {
            console.warn("No viewkey/valuekey set!", newValue);
            return;
        }
        var options = [];
        for (let entry of newValue) {
            const id = entry[this.valuekey];
            const label = entry[this.viewkey];
            const desc = entry[this.desckey];
            options.push({ id, label, desc });
        }
        this.items = options;
        this.renderOptionsList();
        this.renderField();
    }
    get value() {
        return Object.keys(this.selected).join(",");
    }
    set value(newVal) {
        if (!this._list) {
            this.cachedValue = newVal;
            return;
        }

        if (!newVal || !newVal.length) newVal = [];

        let keys = Array.isArray(newVal) ? newVal : newVal.split(",");
        for (let key of keys) {
            if (this.selected[key]) continue;
            let found = false;
            for (let item of this.items) {
                if (item.id === key) {
                    this.selected[key] = item;
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.selected[key] = { id: key, label: key };
            }
        }
        // Remove entries form this.selected that are not in keys
        let oldKeys = Object.keys(this.selected);
        for (let oldKey of oldKeys) {
            if (!keys.includes(oldKey)) {
                delete this.selected[oldKey];
            }
        }

        this.renderField();
    }
    renderOptionsList() {
        while (this._list.firstChild) { this._list.firstChild.remove(); }
        for (var item of this.items) {
            var liEl = document.createElement("li");
            liEl.setAttribute("role", "option");
            liEl.setAttribute("tabindex", -1);
            liEl.dataset.id = item.id;
            liEl.dataset.label = item.label;
            if (item.desc) {
                liEl.dataset.desc = item.desc;
                liEl.innerHTML = `<b>${item.label}</b><br><small>${item.desc}</small>`;
            } else liEl.innerHTML = item.label;
            // Selected?
            if (this.selected[item.id]) {
                liEl.setAttribute('selected', 'selected');
                liEl.setAttribute('aria-selected', true);
                this.selected[item.id] = { id: item.id, label: item.label, desc: item.desc };
            }

            liEl = this._list.appendChild(liEl);
            liEl.addEventListener("click", (e) => this.selectItem(e.target.closest("li"), e));
        }
    }
    renderField() {
        let keys = Object.keys(this.selected);

        // Placeholder
        if (!keys.length) {
            this._field.querySelectorAll(".multiselect-tag").forEach(e => e.remove());
            if (!this._field.querySelector(".multiselect-field-placeholder"))
                this._field.appendChild(this.createPlaceholder());
            this.input.removeAttribute("value");
            return;
        } else {
            let placeholder = this._field.querySelector(".multiselect-field-placeholder");
            if (placeholder) placeholder.remove();
            this.input.setAttribute("value", "-");
        }

        var foundItems = {};
        var nodes = this._field.querySelectorAll(".multiselect-tag");
        for (let node of nodes) {
            const id = node.dataset.id;
            if (!keys.includes(id)) { // Remove
                node.remove();
            } else { // Update
                let tagInfo = this.selected[id];
                if (!tagInfo.label) continue;
                node.querySelector(".multiselect-tag-text").textContent = tagInfo.label;
                foundItems[id] = true;
            }
        }

        // Add
        for (let tagKey of keys) {
            const newTagInfo = this.selected[tagKey];
            const id = newTagInfo.id;
            if (!id || foundItems[id]) continue;

            var tag = document.createElement('div');
            tag.dataset.id = id;
            tag.className = 'multiselect-tag';
            var content = document.createElement('div');
            content.className = 'multiselect-tag-text';
            content.textContent = newTagInfo.label;
            if (newTagInfo.desc) content.title = newTagInfo.desc;
            var removeButton = document.createElement('div');
            removeButton.className = 'multiselect-tag-remove-button';
            removeButton.dataset.id = id;
            removeButton.addEventListener('click', (e) => this.removeClick(e));
            tag.appendChild(content);
            tag.appendChild(removeButton);

            this._field.appendChild(tag);
        }
    }
    fieldClickHandler() {
        this._isOpened ? this.close() : this.open();
    }
    keyDownHandler(event) {
        switch (event.which) {
            case 8:
                this.handleBackspaceKey();
                break;
            case 13:
                this.handleEnterKey();
                break;
            case 27:
                this.handleEscapeKey();
                break;
            case 38:
                event.altKey ? this.handleAltArrowUpKey() : this.handleArrowUpKey();
                break;
            case 40:
                event.altKey ? this.handleAltArrowDownKey() : this.handleArrowDownKey();
                break;
            default:
                return;
        }
        event.preventDefault();
    }
    handleEnterKey() {
        if (this._isOpened) {
            var focusedItem = this.shadowRoot.querySelectorAll('li')[this._focusedItemIndex];
            if (focusedItem) this.selectItem(focusedItem);
        }
    }
    handleArrowDownKey() {
        this._focusedItemIndex = (this._focusedItemIndex < this.shadowRoot.querySelectorAll('li').length - 1)
            ? this._focusedItemIndex + 1
            : 0;
        this.refreshFocusedItem();
    }
    handleArrowUpKey() {
        this._focusedItemIndex = (this._focusedItemIndex > 0)
            ? this._focusedItemIndex - 1
            : this.shadowRoot.querySelectorAll('li').length - 1;
        this.refreshFocusedItem();
    }
    handleAltArrowDownKey() {
        this.open();
    }
    handleAltArrowUpKey() {
        this.close();
    }
    refreshFocusedItem() {
        var el = this.shadowRoot.querySelectorAll('li')[this._focusedItemIndex];
        if (el) el.focus();
    }
    handleBackspaceKey() {
        var selectedItemElements = this.shadowRoot.querySelectorAll("li[selected]");
        if (selectedItemElements.length) {
            const item = selectedItemElements[selectedItemElements.length - 1];
            const itemID = item.dataset.id;
            delete this.selected[itemID];
            item.removeAttribute('selected');
            item.setAttribute('aria-selected', false);
            this.renderField();
            this.fireChangeEvent();
            this.unselectItem();
        }
    }
    handleEscapeKey() {
        this.close();
    }
    selectItem(item, event) {
        if (event) event.stopPropagation();
        if (!item.hasAttribute('selected')) {
            item.setAttribute('selected', 'selected');
            item.setAttribute('aria-selected', true);
            this.selected[item.dataset.id] = { id: item.dataset.id, label: item.dataset.label, desc: item.dataset.desc };
            this.renderField();
            this.fireChangeEvent();
        }
        this.close();
    }
    fireChangeEvent() {
        var event = new CustomEvent("input");
        this.dispatchEvent(event);
    }
    togglePopup(show) {
        this._isOpened = show;
        this._popup.style.display = show ? 'block' : 'none';
        this.setAttribute("aria-expanded", show);
    }
    removeClick(event) {
        event.stopPropagation();
        const id = event.target.dataset.id;
        delete this.selected[id];
        var item = this._list.querySelector('li[data-id="' + id + '"]');
        if (item) {
            item.removeAttribute('selected');
            item.setAttribute('aria-selected', false);
        }
        let fieldItem = event.target.parentElement;
        fieldItem.remove();
        this.fireChangeEvent();
        this._focusedItemIndex = 0;
        if (Object.keys(this.selected).length == 0) this.renderField();
    }
    createPlaceholder() {
        var placeholder = document.createElement('div');
        placeholder.className = 'multiselect-field-placeholder';
        placeholder.textContent = this._options.placeholder;
        return placeholder;
    }
    open() {
        this.togglePopup(true);
        this.refreshFocusedItem();
    }
    close() {
        this.togglePopup(false);
        //this.shadowRoot.focus();
    }
    selectedItems() {
        var result = [];
        var selectedItems = this.shadowRoot.querySelectorAll('li[selected]');
        for (var i = 0; i < selectedItems.length; i++) {
            var selectedItem = selectedItems[i];
            result.push(selectedItem.hasAttribute('value')
                ? selectedItem.getAttribute('value')
                : selectedItem.textContent);
        }
        return result;
    }
}

customElements.define('ui-multiselect', UImultiSelect);