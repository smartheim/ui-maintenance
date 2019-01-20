/**
 * This element renders a list of key-values. A target dom element
 * need to be set via the "contextfrom" attribute.
 * Any dom-query is valid (".my-element-class", "#id-of-elem").
 * 
 * That target element is watched for "contextchanged" events and the initial
 * state is fetched from the "contextdata" property of that element.
 * 
 * Compatible to: oh-context-help.
 * 
 * No shadow-dom: We need styling from outside.
 */
class OhThingProperties extends HTMLElement {
    constructor() {
        super();
        const targetNode = document.querySelector(this.getAttribute("contextfrom"));
        this.nocontent = this.hasAttribute("nocontent") ? this.getAttribute("nocontent") : "No content";
        this.contextchanged({ target: targetNode });
        this.contextchangedBound = (event) => this.contextchanged(event);
    }

    contextchanged(event) {
        var json = event.detail ? event.detail : event.target.contextdata;

        if (!json || json == {}) {
            this.innerText = this.nocontent;
            return;
        }

        const ul = document.createElement('ul');

        this.innerText = '';
        var counter = 0;
        for (const key in json) {
            const value = json[key];
            var li = document.createElement("li");
            li.innerHTML = `<strong>${key}</strong>: ${value}`;
            ul.appendChild(li);
            ++counter;
        }
        if (counter)
            this.appendChild(ul);
        else
            this.innerText = this.nocontent;
    }
}

customElements.define('oh-key-value-list', OhThingProperties);