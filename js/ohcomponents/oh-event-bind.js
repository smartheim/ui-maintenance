/**
 * Extracts a value from an event ("eventName") of a "destination" and adds it as an attribute ("attribute")
 * to the referenced target via element ID given by "for" or by using the next sibling element.
 * 
 * Valid attributes:
 * - from: The event sender. Optional. If not set, will be document
 * - eventName: The eventname to listen to.
 * - for: The target/recepient
 * - attribute: The attribute name that will be set on the target.
 * - setcontent: Boolean. Instead of setting an attribute, the targets content is set.
 */
class OhEventBind extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("Failed to find target", forid);
      return;
    }

    if (this.hasAttribute("from")) {
      this.from = this.getAttribute("from");
      if (!document.querySelector(this.from)) this.from = null;
    }
    if (!this.from) this.from = document;

    this.eventName = this.getAttribute("eventName");
    this.boundMethod = (e) => this.eventMethod(e.detail);
    this.from.addEventListener(this.eventName, this.boundMethod);
  }
  disconnectedCallback() {
    if (this.eventName) this.from.removeEventListener(this.eventName, this.boundMethod);
  }
  eventMethod(e) {
    if (this.hasAttribute("setcontent")) {
      this.target.innerHTML = e;
    } else {
      const attribute = this.getAttribute("attribute");
      this.target.setAttribute(attribute, e);
    }
  }
}

customElements.define('oh-event-bind', OhEventBind);
