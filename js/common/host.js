

// Get openhab host from localStorage or URL if nothing is stored
export function openhabHost() {
    var host = localStorage.getItem("host");
    if (!host) host = window.location.origin;
    return host;
}
