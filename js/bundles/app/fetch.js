
const controller = new AbortController();
const signal = controller.signal;

export function fetchWithTimeout(url, timeout = 1000) {
  setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal, mode: "cors" });
}