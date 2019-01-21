import style from './ui-multiselect.scss';
import { html, render } from 'lit-html';

class UImultiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this._options = {
            placeholder: this.getAttribute("placeholder") || 'Select'
        };
        this.render();
        this._root = this.shadowRoot;
        this._control = this._root.querySelector('.multiselect');
        this._field = this._root.querySelector('.multiselect-field');
        this._popup = this._root.querySelector('.multiselect-popup');
        this._list = this._root.querySelector('.multiselect-list');

        this._field.addEventListener('click', this.fieldClickHandler.bind(this));
        this._control.addEventListener('keydown', this.keyDownHandler.bind(this));
        this._list.addEventListener('click', this.listClickHandler.bind(this));

        if (this.hasAttribute("options")) {
            const items = this.getAttribute("options").split(",");
            for (var item of items) {
                var liEl = document.createElement("li");
                liEl.value = item;
                liEl.textContent = item;
                this._list.appendChild(liEl);
            }
        }

        this.refreshField();
        this.refreshItems();
    }
    disconnectedCallback() {
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
            var focusedItem = this.itemElements[this._focusedItemIndex];
            this.selectItem(focusedItem);
        }
    };
    handleArrowDownKey() {
        this._focusedItemIndex = (this._focusedItemIndex < this.itemElements.length - 1)
            ? this._focusedItemIndex + 1
            : 0;
        this.refreshFocusedItem();
    };
    handleArrowUpKey() {
        this._focusedItemIndex = (this._focusedItemIndex > 0)
            ? this._focusedItemIndex - 1
            : this.itemElements.length - 1;
        this.refreshFocusedItem();
    };
    handleAltArrowDownKey() {
        this.open();
    };
    handleAltArrowUpKey() {
        this.close();
    };
    refreshFocusedItem() {
        var el = this.itemElements[this._focusedItemIndex];
        if (el) el.focus();
    };
    handleBackspaceKey() {
        var selectedItemElements = this._root.querySelectorAll("li[selected]");
        if (selectedItemElements.length) {
            this.unselectItem(selectedItemElements[selectedItemElements.length - 1]);
        }
    };
    handleEscapeKey() {
        this.close();
    };
    listClickHandler(event) {
        var item = event.target;
        while (item && item.tagName !== 'LI') {
            item = item.parentNode;
        }
        this.selectItem(item);
    };
    selectItem(item) {
        if (!item.hasAttribute('selected')) {
            item.setAttribute('selected', 'selected');
            item.setAttribute('aria-selected', true);
            this.fireChangeEvent();
            this.refreshField();
        }
        this.close();
    };
    fireChangeEvent() {
        var event = new CustomEvent("change");
        this.dispatchEvent(event);
    };
    togglePopup(show) {
        this._isOpened = show;
        this._popup.style.display = show ? 'block' : 'none';
        this._control.setAttribute("aria-expanded", show);
    };
    refreshField() {
        this._field.innerHTML = '';
        var selectedItems = this._root.querySelectorAll('li[selected]');
        if (!selectedItems.length) {
            this._field.appendChild(this.createPlaceholder());
            return;
        }
        for (var i = 0; i < selectedItems.length; i++) {
            this._field.appendChild(this.createTag(selectedItems[i]));
        }
    };
    refreshItems() {
        var itemElements = this.itemElements;
        for (var i = 0; i < itemElements.length; i++) {
            var itemElement = itemElements[i];
            itemElement.setAttribute("role", "option");
            itemElement.setAttribute("aria-selected", itemElement.hasAttribute("selected"));
            itemElement.setAttribute("tabindex", -1);
        }
        this._focusedItemIndex = 0;
    };
    get itemElements() {
        return this._root.querySelectorAll('li');
    };
    createPlaceholder() {
        var placeholder = document.createElement('div');
        placeholder.className = 'multiselect-field-placeholder';
        placeholder.textContent = this._options.placeholder;
        return placeholder;
    };
    createTag(item) {
        var tag = document.createElement('div');
        tag.className = 'multiselect-tag';
        var content = document.createElement('div');
        content.className = 'multiselect-tag-text';
        content.textContent = item.textContent;
        var removeButton = document.createElement('div');
        removeButton.className = 'multiselect-tag-remove-button';
        removeButton.addEventListener('click', this.removeTag.bind(this, tag, item));
        tag.appendChild(content);
        tag.appendChild(removeButton);
        return tag;
    };
    removeTag(tag, item, event) {
        this.unselectItem(item);
        event.stopPropagation();
    };
    unselectItem(item) {
        item.removeAttribute('selected');
        item.setAttribute('aria-selected', false);
        this.fireChangeEvent();
        this.refreshField();
    };
    attributeChangedCallback(optionName, oldValue, newValue) {
        this._options[optionName] = newValue;
        this.refreshField();
    };
    open() {
        this.togglePopup(true);
        this.refreshFocusedItem();
    };
    close() {
        this.togglePopup(false);
        this._field.focus();
    };
    selectedItems() {
        var result = [];
        var selectedItems = this._root.querySelectorAll('li[selected]');
        for (var i = 0; i < selectedItems.length; i++) {
            var selectedItem = selectedItems[i];
            result.push(selectedItem.hasAttribute('value')
                ? selectedItem.getAttribute('value')
                : selectedItem.textContent);
        }
        return result;
    };
    render() {
        render(html`<style>${style}</style>
        <div class="multiselect" role="combobox">
            <div class="multiselect-field" tabindex="0"></div>
            <div class="multiselect-popup">
                <ul class="multiselect-list" role="listbox" aria-multiselectable="true">
                    
                </ul>
            </div>
        </div>
        `, this.shadowRoot);
    }
}

customElements.define('ui-multiselect', UImultiSelect);