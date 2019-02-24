import { fetchWithTimeout } from '../_common/fetch';

/**
 * This element renders a list of links (ul->li->a)
 * with available script snippets from, that it fetches
 * from "scriptsnippets/index.json". That file is expected
 * to be a json list with {name,file} entries.
 * 
 * A click on a link will dispatch a "loadscript" event
 * with these "details": {filename}.
 */
class OhScriptSnippets extends HTMLElement {
  constructor() {
    super();

    while (this.firstChild) { this.firstChild.remove(); }

    const ul = document.createElement('ul');
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : null;

    fetchWithTimeout("scriptsnippets/index.json")
      .then(response => response.json())
      .then(json => {
        for (const entry of json) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.innerHTML = entry.name;
          a.href = "#";
          a.addEventListener("click", () => {
            var targetEl = null;
            if (this.target) targetEl = document.getElementById(this.target);
            if (!targetEl) return;
            targetEl.scriptfile = "scriptsnippets/" + entry.file;
          });
          li.appendChild(a);
          ul.appendChild(li);
        }
      }).catch(e => {
        ul.innerText = '';
        var li = document.createElement("li");
        li.innerText = e;
        ul.appendChild(li);
      })

    this.appendChild(ul);
  }
}

customElements.define('oh-script-snippets', OhScriptSnippets);