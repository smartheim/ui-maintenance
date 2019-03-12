/**
 * @category Web Components
 * @customelement nav-breadcrumb
 * @description A navigation breadcrumb.
 * This is rendered as a disabled <a> tag if no parent is known.
 * 
 * A parent is declared via a link tag in the header, like:
 * <link rel="parent" href="rules.html" data-title="Rule list" data-idkey="uid" />
 * 
 * If you do not set the "data-title" attribute, then "Home" will be used.
 * 
 * The "data-idkey" attribute is used to extract that parameter from the query url.
 * It will be used for the parent links hash.
 * So if the page has an url of "http://abc.org?uid=myThing", then the parent link
 * will be constructed as "http://abc.org/rules.html#uid=myThing".
 * 
 * @attribute label The label for the current page. Reactive.
 * 
 * @example <caption>An example</caption>
 * <nav-breadcrumb label="My page"></nav-breadcrumb>
 */
class NavBreadcrumb extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['label'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "label") {
      this.label = this.getAttribute("label");
      this.render();
    }
  }
  connectedCallback() {
    this.style.display = "block";

    const link = document.querySelector('link[rel="parent"]');
    if (link) {
      let paramAsHash = link.dataset.idkey;
      if (paramAsHash) {
        paramAsHash = new URL(window.location).searchParams.get(paramAsHash);
        if (!paramAsHash)
          paramAsHash = "";
        else
          paramAsHash = paramAsHash.replace(/:/g, '_'); // Replace potential colons, as they are not valid for IDs
      }

      this.parentLink = link.href + "#" + paramAsHash;
      this.parent = link.dataset.title ? link.dataset.title : "Home";
    }

    if (this.hasAttribute("label"))
      this.attributeChangedCallback("label");
    else {
      if (!this.label)
        this.label = document.title;
      this.render();
    }
  }
  render() {
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = `
      ${this.parentLink ? `<a href="${this.parentLink}">${this.parent}</a> <span>→</span>` : ``}
      <span>${this.label}</span>`;
  }
}

customElements.define('nav-breadcrumb', NavBreadcrumb);
