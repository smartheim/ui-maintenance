var idcounter = 0;

/**
 * Add this web-component to your page for permanent (but closable) notifications.
 * Create elements of this type via script for dynamic notications.
 * 
 * Notifications with a timeout are removing themselves from the dom again automatically.
 * 
 * Static usage:
 * <ui-notification persistent>My awesome text</ui-notification>
 * 
 * Dynamic usage:
 * var el = document.createElement("ui-notification");
 * el.id = "login";
 * el.setAttribute("closetime", 3000);
 * el.innerHTML = "My dynamic <b>html</b> text";
 * document.body.appendChild(el);
 */
class UiNotification extends HTMLElement {
    constructor() {
        super();

        let tmpl = document.createElement('template');
        tmpl.innerHTML = `<style>:host {
            font-size: 16px;
            color: white;
            background: rgba(0, 0, 0, 0.9);
            line-height: 1.3em;
            padding: 10px 15px;
            margin: 5px 10px;
            position: relative;
            border-radius: 5px;
            transition: opacity 0.5s ease-in;
            display: block;
        }
        :host(.hide) {
            opacity: 0;
        }
        </style><slot></slot>`;
        let shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(tmpl.content.cloneNode(true));
    }
    connectedCallback() {
        this.id = this.hasAttribute("id") ? this.getAttribute("id") : this.id;
        this.target = this.hasAttribute("target") ? this.getAttribute("target") : "alert-area";
        this.hidebutton = this.hasAttribute("hidebutton");
        this.persistent = this.hasAttribute("persistent");
        this.closetime = this.hasAttribute("closetime") ? this.getAttribute("closetime") : 5000;

        if (!this.id) this.id = "notification" + idcounter;
        ++idcounter;

        let target = this.parentNode.ownerDocument.getElementById(this.target);
        if (target != this.parentNode) {
            // Remove existing notification with same id
            let oldmsg = target.querySelector("#" + this.id);
            if (oldmsg && oldmsg != this) oldmsg.remove();
            // Add new one
            target.appendChild(this);
            return;
        }

        const slot = this.shadowRoot.querySelector('slot');
        let nodes = slot.assignedNodes();
        if (!nodes.length) {
            this.innerHTML = "No content!";
            return;
        }

        var closelink = document.createElement("a");
        closelink.href = "#";
        closelink.setAttribute("data-close", "");
        closelink.style.float = "right";
        closelink.innerHTML = "<i class='fas fa-times'></i>";
        if (nodes[0].nodeType == 3) {
            nodes[0].parentNode.insertBefore(document.createElement("div"), nodes[0]);
            nodes[0].previousElementSibling.appendChild(nodes[0]);
        }
        nodes = slot.assignedNodes();
        nodes[0].prepend(closelink);

        for (const node of nodes) {
            var linksThatClose = node.querySelectorAll("a[data-close]");
            linksThatClose.forEach(link => {
                if (this.hidebutton) node.querySelector("a[data-close]").classList.add("d-none");
                else
                    link.addEventListener('click', event => {
                        event.preventDefault();
                        this.hide();
                    });
            })
        }



        if (this.persistent) return;
        this.hideAfterCloseTime();
    }
    hideAfterCloseTime() {
        this.alertTimeout = setTimeout(() => {
            this.alertTimeout = null;
            this.hide();
        }, this.closetime);
    }
    disconnectedCallback() {
        if (this.alertTimeout) clearTimeout(this.alertTimeout);
        if (this.disperseTimeout) clearTimeout(this.disperseTimeout);
        this.disperseTimeout = null;
    }
    hide() {
        this.classList.add('hide');
        this.disperseTimeout = setTimeout(() => this.remove(), 500);
    }
}

customElements.define('ui-notification', UiNotification);