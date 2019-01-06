/**
 * Update the "active" class for the tutorial html partial, depending on the currently
 * shown page.
 */
import { markActiveLinkAfterPageLoad } from "./app.js";
const handler = function () { markActiveLinkAfterPageLoad("tutorialtoc", this); }
document.removeEventListener("DOMContentLoaded", handler);
document.addEventListener("DOMContentLoaded", handler);
handler();