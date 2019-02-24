/**
 * Firefox is the last evergreen browser that does not support dynamic import yet.
 * It will with Firefox 67 (May 2019). Please remove this polyfill after
 * the release.
 */
export function importModule(url) {
  return new Promise((resolve, reject) => {
    const vector = "import" + url.replace(/\./g, "").replace(/\//g, "_");
    if (document.getElementById("id_" + vector)) {
      if (window[vector]) {
        resolve(window[vector]);
      } else {
        reject(new Error(`Import failed earlier: ${url}`));
      }
      return;
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

    script.onerror = () => reject(new Error(`Failed to import: ${url}`));
    script.addEventListener("loaded", (event) => {
      resolve(event.detail);
    }, { passive: true });
    try {
      document.head.appendChild(script);
    } catch (e) {
      console.warn("failed", e);
      reject(new Error(`Failed to import: ${url}`));
    }
  });
}
