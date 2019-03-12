export class FetchError extends Error {
  constructor(message, status) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.status = status;
  }
  networkErrorMessage() {
    return this.message + " (" + this.status + ")";
  }
  toString() {
    return this.message + " (" + this.status + ")";
  }
}

/**
 * Used if multiple items are pushed to REST. A list of failed items is kept.
 */
export class MultiRestError extends Error {
  constructor(message, failedItems, ...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.failedItems = failedItems;
  }
}

export async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: signal, validateHttpsCertificates: false, muteHttpExceptions: true }).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });
  if (!response.ok) {
    const body = await response.text();
    throw new FetchError(response.statusText + " " + body, response.status);
  }
  return response;
}
export async function fetchMethodWithTimeout(url, method, body, contentType = 'application/json', timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const headers = new Headers({ 'content-type': contentType });
  const mode = 'cors';
  const validateHttpsCertificates = false;
  const muteHttpExceptions = true;
  const options = { signal, method, mode, body, validateHttpsCertificates, muteHttpExceptions };
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, contentType ? Object.assign(options, { headers }) : options).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });;
  if (!response.ok) {
    throw new FetchError(response.statusText, response.status);
  }
  return response;
}