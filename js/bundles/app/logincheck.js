import { openhabHost } from './host'
import { fetchWithTimeout } from './fetch'
import { Notification } from './notifications'

const markupCrossOrigin = () => `Cross-orgin access denied for ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a>`;
const markupNotReachable = () => `Could not connect to openHAB on ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a>`;
const markupFailed = () => `Connection to ${openhabHost()} failed`;

const notification = new Notification('alert-area', "loginfail");

/**
 *  Check REST endpoint
 */
export function checkLogin() {
    return fetchWithTimeout(openhabHost() + "/rest")
        .then(response => { // Make a 404 etc throw an exception
            if (!response.ok) {
                throw new Error(response.status);
            }
            return response;
        }).catch(e => {
            if (e.toString().includes("TypeError")) {
                if (window.location.pathname == "/login.html")
                    notification.show(markupFailed());
                else
                    notification.show(markupCrossOrigin());
                throw new Error("crossorigin");
            } else {
                if (window.location.pathname == "/login.html")
                    notification.show(markupFailed());
                else
                    notification.show(markupNotReachable());
                throw e;
            }
        })
}
