export function fetchWithTimeout(url, timeout = 1000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal, mode: "cors" });
}