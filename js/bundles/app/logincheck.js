import { openhabHost } from './host'
import { fetchWithTimeout } from './fetch'

export function checkLogin() {
    // Don't do anything if on the login page already
    if (window.location.origin.indexOf("login.html") != -1)
        return;

    // Check REST endpoint
    fetchWithTimeout(openhabHost() + "/rest")
        .then(response => { // Make a 404 etc throw an exception
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response;
        }).catch(e => {
            var msg;
            if (e == "TypeError: Failed to fetch")
                msg = "crossorigin";
            else
                msg = e.message;
            console.log("openHAB rest endpoint not reachable", e);
            document.dispatchEvent(new CustomEvent('build', { detail: msg }));
        })
}
