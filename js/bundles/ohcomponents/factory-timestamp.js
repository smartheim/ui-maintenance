import { html } from "./hybrids.js";

/**
 * Allows an external refresh Button to be set. A "timestamp" propery is required,
 * that will be reset to 0 on a click to that external button.
 * 
 * No arguments.
 */
export function refreshButton(listener = (host)=>{host.timestamp = 0;}) {
    return {
        set: (host, value) => { },
        connect: (host, key) => {
            var e = document.getElementById(host.getAttribute(key));
            const clickListener = (event) => {
                event.preventDefault();
                listener(host);
            };
            if (e) e.addEventListener("click", clickListener);
            return () => {
                if (e) e.removeEventListener("click", clickListener);
            }
        }
    }
};

/**
 * Allows a timestamp to be stored to localstore and retrieved from it.
 * The localstore key is derived from a "url" property.
 * 
 * No arguments.
 */
export function timestamp() {
    return {
        get: ({ url, cacheTimeMinutes }) => {
            var cacheTimestamp = localStorage.getItem("timestamp_" + url);
            if (!cacheTimestamp) return Date.now() - cacheTimeMinutes * 60 * 1000;
            return cacheTimestamp;
        },
        set: (host) => {
            localStorage.removeItem("timestamp_" + host.url);
        }
    }
};

/**
 * Tries to read html from cache and returns a promise wrapped Hybrid-js html template.
 * 
 * The returned promise is a rejected one if there is no cache entry existing or the
 * cached entry is too old.
 * 
 * @param {String} url The url
 * @param {Number} cacheTime The absolute cache timepoint in milliseconds
 * @param {Function} updateCache An update method
 */
export function fromCache(url, cacheTime, updateCache, updateArguments) {
    var cachedData = localStorage.getItem(url);
    if (cachedData && cacheTime > Date.now()) {
        return Promise.resolve(html`<div style="padding:inherit;margin:inherit;max-width:inherit" innerHTML="${cachedData}"></div>`);
    }
    return new Promise((accept, reject) => {
        updateCache(url, updateArguments).then(parsedHtml => {
            localStorage.setItem(url, parsedHtml);
            localStorage.setItem("timestamp_" + url, Date.now());
            setTimeout(() => accept(html`<div style="padding:inherit;margin:inherit;max-width:inherit" innerHTML="${parsedHtml}"></div>`), 1);
        }).catch(e => reject(e));
    });
}