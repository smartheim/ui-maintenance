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

/**
 * Update the "active" class for link navs.
 */
export function markActiveLinksAfterPageLoad() {
    var elems = document.querySelectorAll(".autoactive");
    for (var elem of elems) {
        const isExact = elem.classList.contains('exact');
        var c = elem.children;
        for (var i = 0; i < c.length; i++) {
            var link = c[i].children[0];
            const classlist = link.classList;
            classlist.remove("active");
            if (link.href && (link.href=="#" || pageMatch(new URL(link.href), isExact)))
                classlist.add("active");
        }
    }
}
