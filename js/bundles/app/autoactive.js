/**
 * Update the "active" class for link navs.
 */
export function markActiveLinksAfterPageLoad() {
    var elems = document.querySelectorAll(".autoactive");
    for (var elem of elems) {
        var c = elem.children;
        for (var i = 0; i < c.length; i++) {
            var link = c[i].children[0];
            const classlist = link.classList;
            classlist.remove("active");
            if (link.href && (link.href=="#" || new URL(link.href).pathname == window.location.pathname))
                classlist.add("active");
        }
    }
}
