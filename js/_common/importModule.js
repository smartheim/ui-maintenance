/**
 * Firefox is the last evergreen browser that does not support dynamic import yet.
 * It will with Firefox 67 (May 2019). Please remove this polyfill after
 * the release.
 */
export async function importModule(url) {
  const vector = "import" + url.replace(/\./g, "").replace(/\//g, "_");
  if (document.getElementById("id_" + vector)) {
    return window[vector];
  }

  const loader = `
  import * as m from "${url}";
  window["${vector}"] = m;
  document.getElementById("id_${vector}").dispatchEvent(new CustomEvent("loaded",{detail:m}))
  `; // export Module

  const script = document.createElement("script");
  script.type = "module";
  script.id = "id_" + vector;
  script.async = 'async';
  script.textContent = loader;

  const promise = new Promise((resolve, reject) => {
    script.onerror = (e) => {
      console.warn(`Failed to import: ${url}`, e);
      reject(new Error(`Failed to import: ${url}`));
    }
    script.addEventListener("loaded", (event) => {
      resolve(event.detail);
    }, { passive: true });
    document.head.appendChild(script);
  });
  window[vector] = promise;
  return promise;
}
