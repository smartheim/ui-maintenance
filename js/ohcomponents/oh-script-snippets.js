import { fetchWithTimeout } from '../_common/fetch';

/**
 * @category Data Components
 * @customelement oh-script-snippets
 * @description This element renders a list of links (ul->li->a)
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
  }
  async connectedCallback() {
    while (this.firstChild) { this.firstChild.remove(); }

    const ul = document.createElement('ul');
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : null;
    this.language = this.hasAttribute("language") ? this.getAttribute("language") : "javascript";

    try {
      const json = await fetchWithTimeout("scriptsnippets/" + this.language + "/index.json").then(response => response.json())
      for (const entry of json) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.innerHTML = entry.name;
        a.href = "#";
        a.addEventListener("click", async (e) => {
          e.preventDefault();
          let targetEl = null;
          if (this.target) targetEl = document.getElementById(this.target);
          if (!targetEl) return;
          targetEl.addAtCursorPosition(await fetchWithTimeout("scriptsnippets/" + this.language + "/" + entry.file).then(d => d.text()));
        });
        li.appendChild(a);
        ul.appendChild(li);
      }
    } catch (e) {
      ul.innerText = '';
      const li = document.createElement("li");
      li.innerText = e;
      ul.appendChild(li);
    }

    this.appendChild(ul);
  }
}

customElements.define('oh-script-snippets', OhScriptSnippets);