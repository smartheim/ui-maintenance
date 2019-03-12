/**
 * @category Data Components
 * @customelement oh-attribute-bind
 * @description Extracts a value from the URL query string ("queryParameter") and adds it as an attribute
 * to the referenced destination via element ID given by "for" or by using the next sibling element.
 * @attribute for The destination dom element [#exampleElement]
 * @attribute queryParameter The URL query part that should be used as source
 * @attribute regex A regular expression to extract something out of the query
 * @attribute setcontent If this is set, not a destination attribute will be set, but the destination inner html content
 * @attribute attribute The destination attribute. Will not be used, if "setcontent" is set.
 */
class OhAttributeBind extends HTMLElement {
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

    const queryParameter = this.getAttribute("queryParameter");

    let paramValue = new URL(window.location).searchParams.get(queryParameter);
    if (!paramValue) {
      return;
    }
    const regex = this.getAttribute("regex");
    if (regex) {
      paramValue = paramValue.match(regex)[1];
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
