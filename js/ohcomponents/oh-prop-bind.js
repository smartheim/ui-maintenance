/**
 * 
 */
class OhPropBind extends HTMLElement {
    constructor() {
        super();

    }

    connectedCallback() {
        const targetNode = document.querySelector(this.getAttribute("contextfrom"));
        const sourceProperty = this.getAttribute("sourceproperty") || "contextdata";
        const data = targetNode[sourceProperty];

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

        if (this.hasAttribute("setcontent")) {
            this.target.innerHTML = data;
        } else if (this.hasAttribute("attribute")) {
            const attribute = this.getAttribute("attribute");
            this.target.setAttribute(attribute, data);
        } else if (this.hasAttribute("property")) {
            const property = this.getAttribute("property");
            this.target[property] = data;
        }
    }


}

customElements.define('oh-prop-bind', OhPropBind);