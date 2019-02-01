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

export async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new FetchError(response.statusText, response.status);
  }
  return response;
}
export async function fetchMethodWithTimeout(url, method, body, contentType = 'application/json', timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const headers = new Headers({ 'content-type': contentType });
  const mode = 'cors';
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, contentType ? { signal, method, headers, mode, body } : { signal, method, mode, body });
  if (!response.ok) {
    throw new FetchError(response.statusText, response.status);
  }
  return response;
}