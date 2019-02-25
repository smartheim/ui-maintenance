import { FlatpickrInstance } from '../_flatpickr';

/**
 * @category Web Components
 * @customelement ui-time-picker
 * @description Time picker
 * @example <caption>An example</caption>
 * <ui-time-picker></ui-time-picker>
 */
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
      options.appendTo = this;
    }
    var div = document.createElement("input");
    div.classList.add("mb-4")
    if (this.hasAttribute("name")) div.setAttribute("name", this.getAttribute("name"));
    if (this.hasAttribute("placeholder")) div.setAttribute("placeholder", this.getAttribute("placeholder"));
    this.removeAttribute("name");
    this.appendChild(div);
    FlatpickrInstance(div, options);
  }
  disconnectedCallback() {
    document.querySelectorAll(".flatpickr-calendar").forEach(e => e.remove());
  }
}

customElements.define('ui-time-picker', UiTimePicker);

/**
 * Time Picker UI module
 * 
 * Because this component is not used on every page, it has its own module.
 * 
 * @category Web Components
 * @module ui-time-picker
 */