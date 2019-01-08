import { openhabHost } from './host'
import { fetchWithTimeout } from '../../common/fetch'
import { Notification } from './notifications'

const markupCrossOrigin = () => `Cross-orgin access denied for ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a>`;
const markupNotReachable = () => `Could not connect to openHAB on ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a>`;
const markupFailed = () => `Connection to ${openhabHost()} failed`;

const notification = new Notification('alert-area', "loginfail");
var evtSource = null;
var loginCached = null;

function sseMessageReceived(e) {
    console.log("received", JSON.parse(e.data));
}

/**
 *  Check REST endpoint
 */
export async function checkLogin(force=false) {
    if (loginCached && !force) return loginCached;
    try {
        const response = fetchWithTimeout(openhabHost() + "/rest");
        if (evtSource) evtSource.removeEventListener("message", sseMessageReceived);
        evtSource = new EventSource("http://192.168.1.8/rest/events");
        evtSource.addEventListener("message", sseMessageReceived, false);
        loginCached = response;
        return response;
    }
    catch (e) {
        if (e.toString().includes("TypeError")) {
            if (window.location.pathname == "/login.html")
                notification.show(markupFailed());
            else
                notification.show(markupCrossOrigin());
            throw new Error("crossorigin");
        }
        else {
            if (window.location.pathname == "/login.html")
                notification.show(markupFailed());
            else
                notification.show(markupNotReachable());
            throw e;
        }
    }
}
