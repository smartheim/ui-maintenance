/**
 * Update the "active" class for child links, depending on the current page url.
 */
class UiNav extends HTMLElement {
    constructor() {
        super();
        this.style.display = "none";
        this.pageChangedBound = () => this.connectedCallback();
        document.addEventListener("DOMContentLoaded", this.pageChangedBound);
    }
    disconnectedCallback() {
        document.removeEventListener("DOMContentLoaded", this.pageChangedBound);
    }
    connectedCallback() {
        var elems = this.parentNode.childNodes;
        const isExact = this.parentNode.classList.contains('exact');
        for (var elem of elems) {
            if (elem == this) continue;
            var link = elem.children[0];
            const classlist = link.classList;
            classlist.remove("active");
            if (link.href && (link.href == "#" || pageMatch(new URL(link.href), isExact)))
                classlist.add("active");
        }
    }
}

/**
 * Return true if the given url matches with the current window url.
 * @param {URL} url The URL
 * @param {boolean} isExact Only match if also the hash matches.
 */
function pageMatch(url, isExact) {
    var b = url.pathname == window.location.pathname;
    if (isExact) {
        b &= url.hash == window.location.hash;
    }
    return b;
}

customElements.define('ui-nav-auto-link', UiNav);