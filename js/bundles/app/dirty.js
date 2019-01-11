/**
 * This code is just for demonstrational purposes and will be factored
 * into real components in the end.
 */

window.toggleContext = (event) => {
    document.querySelector('body').classList.toggle('showcontext');
    event.preventDefault();
}
window.toggleSidebar = (event) => {
    document.querySelector('body').classList.toggle('showsidebar');
    event.preventDefault();
}

function startDirty() {
    var listcontainer = document.getElementById("listcontainer");
    if (listcontainer) {
        var items = document.querySelectorAll(".addonitem");
        for (const item of items) {
            item.addEventListener("click", e => {
                item.classList.toggle("selected");
            });
        }

        var filtermode = document.querySelector("ui-filter");
        filtermode.addEventListener("mode", modeEvent => {
            listcontainer.classList.remove("list", "grid", "textual");
            if (modeEvent.detail.mode == "grid")
                listcontainer.classList.add("grid");
            else if (modeEvent.detail.mode == "list")
                listcontainer.classList.add("list");
            else if (modeEvent.detail.mode == "textual")
                listcontainer.classList.add("textual");
        });
        filtermode.addEventListener("selectmode", modeEvent => {
            if (modeEvent.detail.selectmode)
                listcontainer.classList.add("selectionmode");
            else
                listcontainer.classList.remove("selectionmode");
        });
    }
}


document.addEventListener("DOMContentLoaded", startDirty);
if (['interactive', 'complete'].includes(document.readyState)) startDirty();
