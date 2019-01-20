import flatpickr from './flatpickr';


class UiTimePicker extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        var options = {};
        if (this.hasAttribute("enable-time")) {
            options.enableTime = true;
            options.dateFormat = "Y-m-d H:i";
            options.altFormat = "F j, Y H:i";
            options.time_24hr = true;
        }
        if (this.hasAttribute("inline")) {
            options.inline = true;
        }
        var div = document.createElement("input");
        flatpickr(div, options);
        this.appendChild(div);
    }
    disconnectedCallback() {
        document.querySelectorAll(".flatpickr-calendar").forEach(e => e.remove());
    }
}

customElements.define('ui-time-picker', UiTimePicker);