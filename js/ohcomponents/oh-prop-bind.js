/**
 * @category Data Components
 * @customelement oh-prop-bind
 * @description Extracts a value from the URL query string ("queryParameter") or a propery value of a source element
 * and adds it to the referenced destination. It either adds it as an attribute or a property or to the content area
 * of the referenced destination. The destination is given via element ID by "for" or by the next sibling element will be used.
 * @attribute [for] The destination dom element [#exampleElement]
 * @attribute [contextfrom] A source dom element
 * @attribute [sourceproperty] A property that will be read from the source dom element and used. If not set, "contextdata" will be used.
 * @attribute [queryParameter] The URL query part that should be used as source
 * @attribute [regex] A regular expression to extract something out of the query
 * @attribute [setcontent] If this is set the destination inner html content will be replaced.
 * @attribute [attribute] The destination attribute.
 * @attribute [property] The destination property.
 */
class OhPropBind extends HTMLElement {
  constructor() {
    super();

  }

  connectedCallback() {
    this.style.display = "none";

    let data;

    if (this.hasAttribute("contextfrom")) {
      const targetNode = document.querySelector(this.getAttribute("contextfrom"));
      const sourceProperty = this.getAttribute("sourceproperty") || "contextdata";
      data = targetNode[sourceProperty];
    } else if (this.hasAttribute("queryParameter")) {
      const queryParameter = this.getAttribute("queryParameter");
      const regex = this.getAttribute("regex");
      data = new URL(window.location).searchParams.get(queryParameter);
      if (regex && data) {
        data = data.match(regex)[1];
      }
    }

    if (!data) {
      //throw new Error("No contextfrom or queryParameter set");
      return;
    }

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
    }
    if (this.hasAttribute("attribute")) {
      const attribute = this.getAttribute("attribute");
      this.target.setAttribute(attribute, data);
    }
    if (this.hasAttribute("property")) {
      const property = this.getAttribute("property");
      this.target[property] = data;
    }
  }


}

customElements.define('oh-prop-bind', OhPropBind);