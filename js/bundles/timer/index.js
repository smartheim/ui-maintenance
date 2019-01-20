import './ui-time-picker'

class UiCronExpression extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        var div = document.createElement("input");
        div.classList.add("mb-4")
        div.value = "* * * * *";
        this.appendChild(div);
    }
    disconnectedCallback() {
    }
}

customElements.define('ui-cron-expression', UiCronExpression);