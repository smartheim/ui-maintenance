class NavButtons extends HTMLElement {
  constructor() {
    super();
    this.style.display = "block";
    this.prevLink = this.hasAttribute("prevLink") ? this.getAttribute("prevLink") : null;
    this.nextLink = this.hasAttribute("nextLink") ? this.getAttribute("nextLink") : null;
    this.prevEnabled = this.prevLink != "";
    this.nextEnabled = this.nextLink != "";
   
    if (!this.prevLink) {
      var link = document.querySelector('link[rel="prev"]');
      if (link) this.prevLink = link.href;
      else this.prevLink = "#";
    }

    if (!this.nextLink) {
      var link = document.querySelector('link[rel="next"]');
      if (link) this.nextLink = link.href;
      else this.nextLink = "#";
    }

    this.innerHTML = `
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${prevEnabled ? "" : "disabled"}" href="${prevLink}">Back</a>
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${nextEnabled ? "" : "disabled"}" href="${nextLink}">Next</a>`;
  }
}

customElements.define('nav-buttons', NavButtons);
