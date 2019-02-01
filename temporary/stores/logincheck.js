import { openhabHost } from '../../common/host'

const markupCrossOrigin = () => `<div>Cross-orgin access denied for ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a></div>`;
const markupNotReachable = () => `<div>Could not connect to openHAB on ${openhabHost()}.<br>
<a href="login.html" data-close>Login to openHab instance</a></div>`;
const markupFailed = () => `<div>Connection to ${openhabHost()} failed</div>`;

var evtSource = null;
var loginCached = null;

function sseMessageReceived(e) {
    loginCached = Promise.resolve("");
    console.log("received", JSON.parse(e.data));
}

function sseMessageError(e) {
    console.log("sse error", e);
}

/**
 *  Check REST endpoint
 */
async function checkLogin(force = false) {
    if (loginCached && !force) return loginCached;
    try {
        if (evtSource) { evtSource.onerror = null; evtSource.onmessage = null; evtSource.close(); }
        evtSource = new EventSource(openhabHost() + "/rest/events");
        evtSource.onmessage = sseMessageReceived;
        evtSource.onerror = sseMessageError;
        return Promise.resolve("");
    }
    catch (e) {
        if (e.toString().includes("TypeError")) {
            if (window.location.pathname == "/login.html") {
                var el = document.createElement("ui-notification");
                el.id = "login";
                el.setAttribute("persistent", false);
                el.innerHTML = markupFailed();
                document.body.appendChild(el);
            } else {
                var el = document.createElement("ui-notification");
                el.id = "login";
                el.setAttribute("persistent", false);
                el.innerHTML = markupCrossOrigin();
                document.body.appendChild(el);
            }
        }
        else {
            if (window.location.pathname == "/login.html") {
                var el = document.createElement("ui-notification");
                el.id = "login";
                el.setAttribute("persistent", false);
                el.innerHTML = markupFailed();
                document.body.appendChild(el);
            }
            else {
                var el = document.createElement("ui-notification");
                el.id = "login";
                el.setAttribute("persistent", false);
                el.innerHTML = markupNotReachable();
                document.body.appendChild(el);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", checkLogin);
document.addEventListener("FailedLoading", () => checkLogin(true));
if (['interactive', 'complete'].includes(document.readyState)) checkLogin();
