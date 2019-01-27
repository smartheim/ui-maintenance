class UiSwitch extends HTMLElement {
  constructor() {
    super();
  }
  setCheck(newState, noevents) {
    this.input.checked = newState;
    if (!noevents && !this.disabled) this.dispatchEvent(new Event("input"));
    if (this.showid) {
      var el = document.getElementById(this.showid);
      if (el) {
        if (this.input.checked) {
          el.classList.add("show");
          el.classList.remove("hidden");
        } else {
          el.classList.remove("show");
          el.classList.add("hidden");
        }
      }
    }
  }
  set value(newValue) {
    if (this.input)
      this.setCheck(newValue, true);
    else
      this._value = newValue;
  }
  get value() {
    return this.input && this.input.checked;
  }
  connectedCallback() {
    this.storekey = this.hasAttribute("storekey") ? this.getAttribute("storekey") : null;
    this.documentevent = this.hasAttribute("documentevent") ? this.getAttribute("documentevent") : null;
    while (this.firstChild) { this.firstChild.remove(); }

    const root = document.createElement("div");

    root.classList.add("ui-switch");

    this.input = root.appendChild(document.createElement("input"));
    this.input.type = "checkbox";
    this.addEventListener("click", (e) => {
      e.preventDefault();
      this.input.checked = !this.input.checked;
      this.setCheck(this.input.checked);
      if (this.storekey) localStorage.setItem(this.storekey, this.input.checked);
      if (this.documentevent) document.dispatchEvent(new Event(this.documentevent));
    });
    root.appendChild(document.createElement("span"));
    var titleEl = root.appendChild(document.createElement("div"));

    this.appendChild(root);

    this.showid = this.hasAttribute("showid") ? this.getAttribute("showid") : null;
    titleEl.title = this.hasAttribute("title") ? this.getAttribute("title") : "";
    titleEl.innerHTML = this.hasAttribute("label") ? this.getAttribute("label") : (this.hasAttribute("title") ? this.getAttribute("title") : "");
    if (this.disabled) this.classList.add("disabled"); else this.classList.remove("disabled");

    this.attributeChangedCallback("showid");
    var isChecked = this.hasAttribute("checked") ? this.getAttribute("checked") == "true" : false;
    var cached = this.storekey ? localStorage.getItem(this.storekey) : this._value;
    console.log("checked", isChecked, cached);
    this.setCheck(isChecked || cached, true);
  }
  static get observedAttributes() {
    return ['checked'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.input) return;
    if (name == "checked") {
      this.setCheck(this.getAttribute("checked") == "true");
    } else if (name == "disabled")
      this.disabled = this.hasAttribute("disabled") ? this.getAttribute("disabled") : false;
    else if (name == "showid") {
      this.showid = this.hasAttribute("showid") ? this.getAttribute("showid") : null;
    }
  }
}

customElements.define('ui-switch', UiSwitch);
