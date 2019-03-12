
/**
 * Creates a notification dom element.
 * 
 * @param {String} id The dom ID
 * @param {String} message The message
 * @param {Boolean} persistent If set to true, the notification will not auto-dismiss
 * @param {Integer} timeout The timeout in milliseconds.
 * @see module:uicomponents
 * @category App
 * @memberof module:app
 */
export function createNotification(id, message, persistent = false, timeout = 5000) {
  const oldEl = id ? document.getElementById(id) : null;
  const el = oldEl ? oldEl : document.createElement("ui-notification");
  if (id) el.id = id;
  el.setAttribute("closetime", timeout);
  if (persistent) el.setAttribute("persistent", "true");
  el.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(el);
}
