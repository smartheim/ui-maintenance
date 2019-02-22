import { StateWhileRevalidateStore } from './store';
import { process } from './sortFilterLimit';

const store = new StateWhileRevalidateStore;

/**
 * This is meant to be used as a web-worker or as a shared-web-worker.
 * In this main entry point file the web-worker message channel is established
 * and incoming messages are proxied to the store and store responses
 * as well as events are marshalled into outgoing messages.
 */
class StorageWorker {
  constructor() {
    store.addEventListener("storeChanged", (e) => this.postMessage({ type: e.type, msg: e.detail }));
    store.addEventListener("storeItemChanged", (e) => this.postMessage({ type: e.type, msg: e.detail }));
    store.addEventListener("storeItemAdded", (e) => this.postMessage({ type: e.type, msg: e.detail }));
    store.addEventListener("storeItemRemoved", (e) => this.postMessage({ type: e.type, msg: e.detail }));
    store.addEventListener("connectionEstablished", (e) => this.postMessage({ type: e.type, msg: e.detail }));
    store.addEventListener("connectionLost", (e) => this.postMessage({ type: e.type, msg: e.detail }));
  }
  addPort(port) {
    this.port = port;
    port.onmessage = (e) => this.handleMessage(e);
  }
  postMessage(data) {
    if (!this.port) return;
    this.port.postMessage(data);
  }
  async handleMessage(msgEvent) {
    const e = msgEvent.data;
    let r;
    try {
      switch (e.type) {
        case "configure":
          r = await store.configure(e.expireDurationMS, e.throttleTimeMS);
          break;
        case "reconnect":
          r = await store.reconnect(e.host);
          break;
        case "dump":
          r = await store.dump();
          break;
        case "get":
          if (e.objectid)
            r = await store.get(e.storename, e.objectid, e.options || {});
          else
            r = await store.getAll(e.storename, e.options || {});
          if (e.options && Array.isArray(r)) {
            r = process(r, e.options);
          }
          break;
        case "injectTutorialData":
          r = await store.injectTutorialData(e.storename, e.objectdata);
          break;
        case "removeTutorialData":
          r = await store.removeTutorialData();
          break;
        default:
          r = new Error("Type not supported");
          break;
      }
      this.postMessage({ type: e.type, result: r, msgid: e.msgid });
    } catch (error) {
      console.warn(error);
      this.postMessage({ type: e.type, result: error.toString(), iserror: true, msgid: e.msgid });
    }
  }
}

const worker = new StorageWorker();
worker.addPort(self);

// If this is a shared-webworker
self.addEventListener("connect", connection => {
  console.debug("client connected to shared-webworker");
  worker.addPort(connection.ports[0]);
}, false);