class OhAttributeBind extends HTMLElement {
    constructor() {
        super();
        this.style.display = "none";
    }
    connectedCallback() {
        const forid = this.getAttribute("for");
        this.target = document.getElementById(forid);
        if (!this.target) {
            this.target = this.nextElementSibling;
        }
        if (!this.target) {
            console.warn("Failed to find target", forid);
            return;
        }

        const queryParameter = this.getAttribute("queryParameter");

        let paramValue = new URL(window.location).searchParams.get(queryParameter);
        if (!paramValue) {
            return;
        }

        if (this.hasAttribute("setcontent")) {
            this.target.innerHTML = paramValue;
        } else {
            const attribute = this.getAttribute("attribute");
            this.target.setAttribute(attribute, paramValue);
        }
    }
    disconnectedCallback() {
    }
}

customElements.define('oh-attribute-bind', OhAttributeBind);
