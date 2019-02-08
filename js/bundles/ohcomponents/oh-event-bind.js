/**
 * Extracts a value from an event ("eventName") of a "destination" and adds it as an attribute ("attribute")
 * to the referenced target via element ID given by "for" or by using the next sibling element.
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

        this.eventName = this.getAttribute("eventName");
        this.boundMethod = (e) => this.eventMethod(e.detail);
        console.log("ADD EVENT", this.eventName);
        document.addEventListener(this.eventName, this.boundMethod);
    }
    disconnectedCallback() {
        if (this.eventName) document.removeEventListener(this.eventName, this.boundMethod);
    }
    eventMethod(e) {
        console.log("RECEIVED event");
        if (this.hasAttribute("setcontent")) {
            this.target.innerHTML = e;
        } else {
            const attribute = this.getAttribute("attribute");
            this.target.setAttribute(attribute, e);
        }
    }
}

customElements.define('oh-event-bind', OhEventBind);
