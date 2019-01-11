import { fetchWithTimeout } from '../../common/fetch';

class OhScriptSnippets extends HTMLElement {
  constructor() {
    super();
    // const shadow = this.attachShadow({ mode: 'open' });
    const ul = document.createElement('ul');

    fetchWithTimeout("scriptsnippets/index.json")
      .then(response => response.json())
      .then(json => {
        ul.innerText = '';
        for (const entry of json) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.innerHTML = entry.name;
          a.href = "#";
          a.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("loadscript", { detail: {filename: "scriptsnippets/" + entry.file} }));
            console.log("script snippets load file", entry.file);
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

    // shadow.appendChild(ul);
    this.appendChild(ul);
  }
}

customElements.define('oh-script-snippets', OhScriptSnippets);