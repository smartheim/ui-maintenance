/* Hopefully no database operation takes longer than this */
const QUEUE_TIMEOUT = 5000;

/**
 * This is a proxy to the database web-worker and mostly implements
 * a message queue. Each exposed method returns a promise that
 * resolves as soon as the web-worker has send a response.
 * 
 * This is also an EventTarget, meaning that it emits events:
 * - "connectionLost": The connection is lost
 * - "connectionEstablished": The connection has been established
 * - "storeChanged": A complete table (e.g. "items", "things") has changed
 * - "storeItemChanged": One item in a table (e.g. one item in "items") has changed
 * - "storeItemRemoved"
 * - "storeItemAdded"
 * 
 * The following properties are available:
 * - "connected": Boolean
 * - "connectionErrorMessage": String
 * - "connectErrorType": The error type. E.g. 404, 403, 4041 (cross-origin) etc
 * - "host": The host:port that the storage wanted to connect to.
 *      If reconnect has not be called yet, this is `null`.
 * 
 * @category App
 * @memberof module:app
 */
export class StorageConnector extends EventTarget {
  constructor() {
    super();
    this.queueid = 1;
    this.queue = {};
    this.host = null;
    this.connected = false;
    this.connectErrorType = 0;
    this.connectionErrorMessage = "";

    const workerfile = './js/storage-webworker.js';
    const sharedworker = false; // shared workers are not available in Safari yet
    this.storageWorker = sharedworker ? new SharedWorker(workerfile, { name: "Storage Worker" }) :
      new Worker(workerfile, { name: "Storage Worker" }); // , type: "module" 
    this.storageWorker.onerror = (e) => {
      console.warn("Database web-worker failed!", e);
      this.dispatchEvent(new CustomEvent("connectionLost", { detail: e }));
    };
    this.port = false ? this.storageWorker.port : this.storageWorker;
    this.port.onmessage = msgEvent => {
      const e = msgEvent.data;
      if (e.msgid) {
        const queueItem = this.queue[e.msgid];
        if (queueItem) {
          if (e.iserror)
            queueItem.accept(new Error(e.result));
          else
            queueItem.accept(e.result);
        }
      } else if (!e.type) {
        console.warn("Database event received without type!", e);
      } else {
        // console.debug("received notification from webworker", e);
        switch (e.type) {
          case "connectionLost":
            this.connected = false;
            this.connectErrorType = e.msg.type;
            this.connectionErrorMessage = e.msg.message;
            break;
          case "connectionEstablished":
            this.connected = true;
            this.connectErrorType = 0;
            this.connectionErrorMessage = "";
            break;
        }
        this.dispatchEvent(new CustomEvent(e.type, { detail: e.msg }));
      }
    };
  }
  dispose() {
    this.storageWorker.terminate();
  }
  dump() {
    const type = "dump";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid });
    return qitem.promise;
  }
  reconnect(host) {
    this.dispatchEvent(new CustomEvent("connecting"));
    this.host = host;
    const type = "reconnect";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, host });
    return qitem.promise;
  }
  configure(expireDurationMS, throttleTimeMS) {
    const type = "configure";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, expireDurationMS, throttleTimeMS });
    return qitem.promise;
  }
  /**
   * Get a value from the database (and fetch a refreshed copy in the background).
   * 
   * @param {String} storename The store name
   * @param {String} objectid If an object id is given, that specific object is returned from the table.
   * @param {Object} options An options object (sort:"criteria",direction:"",filter:"abc",filterKey:"name",limit: 100)
   */
  get(storename, objectid = null, options = null) {
    const type = "get";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, storename, objectid, options });
    return qitem.promise;
  }

  /**
   * Injects an object into the given store.
   * @param {String} storename The store name
   * @param {Object} objectdata The object data
   */
  injectTutorialData(storename, objectdata) {
    const type = "injectTutorialData";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, storename, objectdata });
    return qitem.promise;
  }

  /**
   * Removes all tutorial data from the database.
   */
  removeTutorialData() {
    const type = "removeTutorialData";
    const qitem = new QueueItem(this, type);
    const msgid = qitem.id;
    this.port.postMessage({ type, msgid, storename });
    return qitem.promise;
  }
}

class QueueItem {
  constructor(storageConnector, type) {
    this.type = type;
    this.queue = storageConnector.queue;
    this.timer = setTimeout(() => this.timeout(), QUEUE_TIMEOUT);
    this.id = storageConnector.queueid;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.queue[this.id] = this;
    storageConnector.queueid += 1;
  }
  accept(val) {
    delete this.queue[this.id];
    clearTimeout(this.timer);
    if (val instanceof Error) {
      this.reject(val);
    } else
      this.resolve(val);
  }
  timeout() {
    delete this.queue[this.id];
    this.reject("StorageConnector queue item '" + this.type + "' timed out");
  }
}
