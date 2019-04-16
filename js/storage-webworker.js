function toArray(arr) {
  return Array.prototype.slice.call(arr);
}

function promisifyRequest(request) {
  return new Promise(function(resolve, reject) {
    request.onsuccess = function() {
      resolve(request.result);
    };

    request.onerror = function() {
      reject(request.error);
    };
  });
}

function promisifyRequestCall(obj, method, args) {
  var request;
  var p = new Promise(function(resolve, reject) {
    request = obj[method].apply(obj, args);
    promisifyRequest(request).then(resolve, reject);
  });

  p.request = request;
  return p;
}

function promisifyCursorRequestCall(obj, method, args) {
  var p = promisifyRequestCall(obj, method, args);
  return p.then(function(value) {
    if (!value) return;
    return new Cursor(value, p.request);
  });
}

function proxyProperties(ProxyClass, targetProp, properties) {
  properties.forEach(function(prop) {
    Object.defineProperty(ProxyClass.prototype, prop, {
      get: function() {
        return this[targetProp][prop];
      },
      set: function(val) {
        this[targetProp][prop] = val;
      }
    });
  });
}

function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
  properties.forEach(function(prop) {
    if (!(prop in Constructor.prototype)) return;
    ProxyClass.prototype[prop] = function() {
      return promisifyRequestCall(this[targetProp], prop, arguments);
    };
  });
}

function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
  properties.forEach(function(prop) {
    if (!(prop in Constructor.prototype)) return;
    ProxyClass.prototype[prop] = function() {
      return this[targetProp][prop].apply(this[targetProp], arguments);
    };
  });
}

function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
  properties.forEach(function(prop) {
    if (!(prop in Constructor.prototype)) return;
    ProxyClass.prototype[prop] = function() {
      return promisifyCursorRequestCall(this[targetProp], prop, arguments);
    };
  });
}

function Index(index) {
  this._index = index;
}

proxyProperties(Index, '_index', [
  'name',
  'keyPath',
  'multiEntry',
  'unique'
]);

proxyRequestMethods(Index, '_index', IDBIndex, [
  'get',
  'getKey',
  'getAll',
  'getAllKeys',
  'count'
]);

proxyCursorRequestMethods(Index, '_index', IDBIndex, [
  'openCursor',
  'openKeyCursor'
]);

function Cursor(cursor, request) {
  this._cursor = cursor;
  this._request = request;
}

proxyProperties(Cursor, '_cursor', [
  'direction',
  'key',
  'primaryKey',
  'value'
]);

proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
  'update',
  'delete'
]);

// proxy 'next' methods
['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
  if (!(methodName in IDBCursor.prototype)) return;
  Cursor.prototype[methodName] = function() {
    var cursor = this;
    var args = arguments;
    return Promise.resolve().then(function() {
      cursor._cursor[methodName].apply(cursor._cursor, args);
      return promisifyRequest(cursor._request).then(function(value) {
        if (!value) return;
        return new Cursor(value, cursor._request);
      });
    });
  };
});

function ObjectStore(store) {
  this._store = store;
}

ObjectStore.prototype.createIndex = function() {
  return new Index(this._store.createIndex.apply(this._store, arguments));
};

ObjectStore.prototype.index = function() {
  return new Index(this._store.index.apply(this._store, arguments));
};

proxyProperties(ObjectStore, '_store', [
  'name',
  'keyPath',
  'indexNames',
  'autoIncrement'
]);

proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
  'put',
  'add',
  'delete',
  'clear',
  'get',
  'getAll',
  'getKey',
  'getAllKeys',
  'count'
]);

proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
  'openCursor',
  'openKeyCursor'
]);

proxyMethods(ObjectStore, '_store', IDBObjectStore, [
  'deleteIndex'
]);

function Transaction(idbTransaction) {
  this._tx = idbTransaction;
  this.complete = new Promise(function(resolve, reject) {
    idbTransaction.oncomplete = function() {
      resolve();
    };
    idbTransaction.onerror = function() {
      reject(idbTransaction.error);
    };
    idbTransaction.onabort = function() {
      reject(idbTransaction.error);
    };
  });
}

Transaction.prototype.objectStore = function() {
  return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
};

proxyProperties(Transaction, '_tx', [
  'objectStoreNames',
  'mode'
]);

proxyMethods(Transaction, '_tx', IDBTransaction, [
  'abort'
]);

function UpgradeDB(db, oldVersion, transaction) {
  this._db = db;
  this.oldVersion = oldVersion;
  this.transaction = new Transaction(transaction);
}

UpgradeDB.prototype.createObjectStore = function() {
  return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
};

proxyProperties(UpgradeDB, '_db', [
  'name',
  'version',
  'objectStoreNames'
]);

proxyMethods(UpgradeDB, '_db', IDBDatabase, [
  'deleteObjectStore',
  'close'
]);

function DB(db) {
  this._db = db;
}

DB.prototype.transaction = function() {
  return new Transaction(this._db.transaction.apply(this._db, arguments));
};

proxyProperties(DB, '_db', [
  'name',
  'version',
  'objectStoreNames'
]);

proxyMethods(DB, '_db', IDBDatabase, [
  'close'
]);

// Add cursor iterators
// TODO: remove this once browsers do the right thing with promises
['openCursor', 'openKeyCursor'].forEach(function(funcName) {
  [ObjectStore, Index].forEach(function(Constructor) {
    // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
    if (!(funcName in Constructor.prototype)) return;

    Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
      var args = toArray(arguments);
      var callback = args[args.length - 1];
      var nativeObject = this._store || this._index;
      var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
      request.onsuccess = function() {
        callback(request.result);
      };
    };
  });
});

// polyfill getAll
[Index, ObjectStore].forEach(function(Constructor) {
  if (Constructor.prototype.getAll) return;
  Constructor.prototype.getAll = function(query, count) {
    var instance = this;
    var items = [];

    return new Promise(function(resolve) {
      instance.iterateCursor(query, function(cursor) {
        if (!cursor) {
          resolve(items);
          return;
        }
        items.push(cursor.value);

        if (count !== undefined && items.length == count) {
          resolve(items);
          return;
        }
        cursor.continue();
      });
    });
  };
});

function openDb(name, version, upgradeCallback) {
  var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
  var request = p.request;

  if (request) {
    request.onupgradeneeded = function(event) {
      if (upgradeCallback) {
        upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
      }
    };
  }

  return p.then(function(db) {
    return new DB(db);
  });
}

class FetchError extends Error {
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

async function fetchWithTimeout(url, timeout = 5000) {
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

const EQ_TRESHOLD = 3;

/**
* This class takes one list of items ("old") and another list of items ("new").
* It computes a hash for each item in the old list and stores them in an associative
* map indexed by the property given with "key_id". If you now call "compareNewAndOld"
* with a "new" item the method will also compute a hash and can tell you if the
* old and new item are different (ignoring the order of properties).
*
* ## Implementation
* 
* This is a fast, not a perfect implementation. Objects are flattened before
* they are hashed. Properties are sorted via the standard JS sort algorithm.
* The hash is a 32bit number and basically a sum up of all values converted to string.
*/
class CompareTwoDataSets {
  /**
  * @param {String} key_id The key name for this store (e.g. "id","uid" etc)
  * @param {String} storename The storename for debugging messages
  * @param {Object} oldData The old data
  */
  constructor(key_id, oldData) {
    this.key_id = key_id;
    this.ok = true;

    var indexedData = {};
    if (this.key_id) {
      if (this.key_id) {
        indexedData._ok = true;
        for (let d of oldData) indexedData[d[this.key_id]] = hashCode(d);
      }
    }
    this.indexedData = indexedData;
    this.listOfUnequal = [];
  }

  /**
   * Compare old entry with new one. If different: Add to `listOfUnequal`.
   * 
   * @returns Return true if equal and false otherwise.
   */
  compareNewAndOld(entry, storename) {
    if (!this.ok) return false;

    const newHash = hashCode(entry);
    const id = entry[this.key_id];
    const oldHash = this.indexedData[id];
    if (newHash != oldHash) {
      if (storename) console.debug("replaceStore !entry", storename, id, newHash, oldHash);
      this.listOfUnequal.push(entry);
      if (this.listOfUnequal.length > EQ_TRESHOLD) this.ok = false;
      return false;
    }
    return true;
  }
}


function flattenObject(ob) {
  var toReturn = {};

  for (var i in ob) {
    if ((typeof ob[i]) == 'object') {
      var flatObject = flattenObject(ob[i]);
      for (var x in flatObject) {
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
function hashCode(obj) {
  obj = flattenObject(obj);
  var str = "";
  Object.keys(obj).sort().forEach(key => str += obj[key]);

  let hash = 0;
  if (str.length == 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

const iconset = [
  "attic",
  "bath",
  "bedroom",
  "cellar",
  "corridor",
  "firstfloor",
  "garage",
  "garden",
  "groundfloor",
  "kitchen",
  "office",
  "terrace",
  "battery",
  "blinds",
  "camera",
  "door",
  "frontdoor",
  "garagedoor",
  "lawnmower",
  "lightbulb",
  "lock",
  "poweroutlet",
  "projector",
  "receiver",
  "screen",
  "siren",
  "wallswitch",
  "whitegood",
  "window",
  "colorpicker",
  "group",
  "rollershutter",
  "slider",
  "switch",
  "text",
  "humidity",
  "moon",
  "rain",
  "snow",
  "sun",
  "sun_clouds",
  "temperature",
  "wind",
  "batterylevel",
  "carbondioxide",
  "colorlight",
  "energy",
  "fire",
  "flow",
  "gas",
  "light",
  "lowbattery",
  "motion",
  "oil",
  "pressure",
  "price",
  "qualityofservice",
  "smoke",
  "soundvolume",
  "temperature",
  "time",
  "water",
  "heating",
  "mediacontrol",
  "movecontrol",
  "zoom",
  "alarm",
  "party",
  "presence",
  "vacation",
  "baby_1",
  "baby_2",
  "baby_3",
  "baby_4",
  "baby_5",
  "baby_6",
  "bedroom_blue",
  "bedroom_orange",
  "bedroom_red",
  "bluetooth",
  "boy_1",
  "boy_2",
  "boy_3",
  "boy_4",
  "boy_5",
  "boy_6",
  "calendar",
  "chart",
  "cinema",
  "cinemascreen",
  "cistern",
  "climate",
  "colorwheel",
  "contact",
  "dryer",
  "error",
  "fan",
  "fan_box",
  "fan_ceiling",
  "faucet",
  "flowpipe",
  "garage_detached",
  "garage_detached_selected",
  "girl_1",
  "girl_2",
  "girl_3",
  "girl_4",
  "girl_5",
  "girl_6",
  "greenhouse",
  "house",
  "incline",
  "keyring",
  "line",
  "man_1",
  "man_2",
  "man_3",
  "man_4",
  "man_5",
  "man_6",
  "microphone",
  "network",
  "niveau",
  "none",
  "outdoorlight",
  "pantry",
  "parents_1_1",
  "parents_1_2",
  "parents_1_3",
  "parents_1_4",
  "parents_1_5",
  "parents_1_6",
  "parents_2_1",
  "parents_2_2",
  "parents_2_3",
  "parents_2_4",
  "parents_2_5",
  "parents_2_6",
  "parents_3_1",
  "parents_3_2",
  "parents_3_3",
  "parents_3_4",
  "parents_3_5",
  "parents_3_6",
  "parents_4_1",
  "parents_4_2",
  "parents_4_3",
  "parents_4_4",
  "parents_4_5",
  "parents_4_6",
  "parents_5_1",
  "parents_5_2",
  "parents_5_3",
  "parents_5_4",
  "parents_5_5",
  "parents_5_6",
  "parents_6_1",
  "parents_6_2",
  "parents_6_3",
  "parents_6_4",
  "parents_6_5",
  "parents_6_6",
  "pie",
  "piggybank",
  "player",
  "poweroutlet_au",
  "poweroutlet_eu",
  "poweroutlet_uk",
  "poweroutlet_us",
  "pump",
  "radiator",
  "recorder",
  "returnpipe",
  "rgb",
  "settings",
  "sewerage",
  "shield",
  "smiley",
  "sofa",
  "softener",
  "solarplant",
  "soundvolume_mute",
  "status",
  "suitcase",
  "sunrise",
  "sunset",
  "temperature_cold",
  "temperature_hot",
  "toilet",
  "video",
  "wardrobe",
  "washingmachine",
  "washingmachine_2",
  "woman_1",
  "woman_2",
  "woman_3",
  "woman_4",
  "woman_5",
  "woman_6",
];

const osgibundles = [
  {
    "id": 20,
    "state": "Active",
    "lvl": 80,
    "version": "5.3.1.201602281253",
    "name": "OSGi JAX-RS Connector"
  },
  {
    "id": 21,
    "state": "Active",
    "lvl": 80,
    "version": "2.7.0.v20170129-0911",
    "name": "Gson: Google Json Library for Java"
  },
  {
    "id": 23,
    "state": "Active",
    "lvl": 80,
    "version": "3.0.0.v201312141243",
    "name": "Google Guice (No AOP)"
  },
  {
    "id": 26,
    "state": "Active",
    "lvl": 80,
    "version": "3.5.4",
    "name": "JmDNS"
  },
  {
    "id": 28,
    "state": "Active",
    "lvl": 80,
    "version": "1.0.0",
    "name": "Units of Measurement API"
  },
  {
    "id": 30,
    "state": "Active",
    "lvl": 80,
    "version": "1.1.0.Final",
    "name": "Bean Validation API"
  },
  {
    "id": 31,
    "state": "Active",
    "lvl": 80,
    "version": "2.0.1",
    "name": "javax.ws.rs-api"
  },
  {
    "id": 32,
    "state": "Active",
    "lvl": 80,
    "version": "3.2.0.v201101311130",
    "name": "ANTLR Runtime"
  },
  {
    "id": 35,
    "state": "Active",
    "lvl": 80,
    "version": "3.2.1",
    "name": "Commons Collections"
  },
  {
    "id": 36,
    "state": "Active",
    "lvl": 80,
    "version": "1.1",
    "name": "Commons Exec"
  },
  {
    "id": 37,
    "state": "Active",
    "lvl": 80,
    "version": "2.2.0",
    "name": "Commons IO"
  },
  {
    "id": 38,
    "state": "Active",
    "lvl": 80,
    "version": "2.6",
    "name": "Commons Lang"
  },
  {
    "id": 47,
    "state": "Active",
    "lvl": 80,
    "version": "4.2.1",
    "name": "Apache Karaf :: OSGi Services :: Event"
  },
  {
    "id": 63,
    "state": "Active",
    "lvl": 80,
    "version": "4.6.0",
    "name": "Apache XBean OSGI Bundle Utilities"
  },
  {
    "id": 64,
    "state": "Active",
    "lvl": 80,
    "version": "4.6.0",
    "name": "Apache XBean :: Classpath Resource Finder"
  },
  {
    "id": 65,
    "state": "Active",
    "lvl": 80,
    "version": "2.12.0.v20160420-0247",
    "name": "EMF Common"
  },
  {
    "id": 66,
    "state": "Active",
    "lvl": 80,
    "version": "2.12.0.v20160420-0247",
    "name": "EMF Ecore"
  },
  {
    "id": 67,
    "state": "Active",
    "lvl": 80,
    "version": "2.11.0.v20160420-0247",
    "name": "EMF Change Model"
  },
  {
    "id": 68,
    "state": "Active",
    "lvl": 80,
    "version": "2.12.0.v20160420-0247",
    "name": "EMF XML/XMI Persistence"
  },
  {
    "id": 69,
    "state": "Active",
    "lvl": 80,
    "version": "3.8.0.v20160509-1230",
    "name": "Common Eclipse Runtime"
  },
  {
    "id": 70,
    "state": "Active",
    "lvl": 80,
    "version": "3.6.100.v20160223-2218",
    "name": "Extension Registry Support"
  },
  {
    "id": 80,
    "state": "Active",
    "lvl": 80,
    "version": "9.4.11.v20180605",
    "name": "Jetty :: Proxy"
  },
  {
    "id": 94,
    "state": "Active",
    "lvl": 80,
    "version": "0.4.1.v20180515-1321",
    "name": "org.eclipse.lsp4j"
  },
  {
    "id": 95,
    "state": "Active",
    "lvl": 80,
    "version": "0.4.1.v20180515-1321",
    "name": "org.eclipse.lsp4j.jsonrpc"
  },
  {
    "id": 96,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Config Core"
  },
  {
    "id": 97,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Configuration Discovery"
  },
  {
    "id": 98,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Configuration mDNS Discovery"
  },
  {
    "id": 99,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Config Dispatcher"
  },
  {
    "id": 100,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Config XML"
  },
  {
    "id": 101,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core"
  },
  {
    "id": 102,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Audio"
  },
  {
    "id": 103,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Binding XML"
  },
  {
    "id": 104,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core ID"
  },
  {
    "id": 105,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Persistence"
  },
  {
    "id": 106,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Scheduler Service"
  },
  {
    "id": 107,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Thing"
  },
  {
    "id": 108,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Thing XML"
  },
  {
    "id": 109,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Transformation Service"
  },
  {
    "id": 110,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core Voice"
  },
  {
    "id": 111,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Console"
  },
  {
    "id": 112,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Console for OSGi runtime Karaf"
  },
  {
    "id": 113,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome JavaSound I/O, Fragments: 180"
  },
  {
    "id": 114,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Monitor"
  },
  {
    "id": 115,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Net I/O Bundle"
  },
  {
    "id": 116,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome REST Interface Bundle"
  },
  {
    "id": 117,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Core REST API"
  },
  {
    "id": 118,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome REST mDNS Announcer"
  },
  {
    "id": 119,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome REST Interface JAX-RS optimization Bundle"
  },
  {
    "id": 120,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Sitemap REST API"
  },
  {
    "id": 121,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome SSE REST API"
  },
  {
    "id": 122,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Voice REST API"
  },
  {
    "id": 123,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Bonjour/MDS Service Discovery Bundle"
  },
  {
    "id": 124,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Web Audio Support"
  },
  {
    "id": 125,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Model Core"
  },
  {
    "id": 126,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Item Model"
  },
  {
    "id": 127,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Item Model IDE"
  },
  {
    "id": 128,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Item Model Runtime"
  },
  {
    "id": 129,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Language Server"
  },
  {
    "id": 130,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Persistence Model"
  },
  {
    "id": 131,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Persistence Model IDE"
  },
  {
    "id": 132,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Persistence Runtime"
  },
  {
    "id": 133,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Rule Model"
  },
  {
    "id": 134,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Rule Model IDE"
  },
  {
    "id": 135,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Rule Runtime"
  },
  {
    "id": 136,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Script"
  },
  {
    "id": 137,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Script Model IDE"
  },
  {
    "id": 138,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Script Runtime"
  },
  {
    "id": 139,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Sitemap Model"
  },
  {
    "id": 140,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Sitemap Model IDE"
  },
  {
    "id": 141,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Sitemap Runtime"
  },
  {
    "id": 142,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Thing Model"
  },
  {
    "id": 143,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Thing Model IDE"
  },
  {
    "id": 144,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Thing Model Runtime"
  },
  {
    "id": 145,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Json Storage Service"
  },
  {
    "id": 146,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome UI"
  },
  {
    "id": 147,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome UI Icons"
  },
  {
    "id": 148,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Classic IconSet"
  },
  {
    "id": 149,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1629",
    "name": "Xtend Runtime Library"
  },
  {
    "id": 150,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1629",
    "name": "Xtend Macro Interfaces"
  },
  {
    "id": 151,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1821",
    "name": "Xtext"
  },
  {
    "id": 152,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1833",
    "name": "Xtext Common Types"
  },
  {
    "id": 153,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1821",
    "name": "Xtext IDE Core"
  },
  {
    "id": 154,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1821",
    "name": "Xtext Utility"
  },
  {
    "id": 155,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1833",
    "name": "Xbase Model"
  },
  {
    "id": 156,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1833",
    "name": "Xbase Generic IDE Services"
  },
  {
    "id": 157,
    "state": "Active",
    "lvl": 80,
    "version": "2.14.0.v20180522-1629",
    "name": "Xbase Runtime Library"
  },
  {
    "id": 172,
    "state": "Active",
    "lvl": 80,
    "version": "1.9.6",
    "name": "MIME streaming extension"
  },
  {
    "id": 174,
    "state": "Active",
    "lvl": 80,
    "version": "6.2.0",
    "name": "org.objectweb.asm"
  },
  {
    "id": 175,
    "state": "Active",
    "lvl": 80,
    "version": "6.2.0",
    "name": "org.objectweb.asm.commons"
  },
  {
    "id": 176,
    "state": "Active",
    "lvl": 80,
    "version": "6.2.0",
    "name": "org.objectweb.asm.tree"
  },
  {
    "id": 177,
    "state": "Active",
    "lvl": 90,
    "version": "2.4.0.201810032130",
    "name": "openHAB Core"
  },
  {
    "id": 178,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "openHAB Karaf Integration"
  },
  {
    "id": 180,
    "state": "Resolved",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "openHAB Sound Support, Hosts: 113"
  },
  {
    "id": 181,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "openHAB Dashboard UI"
  },
  {
    "id": 186,
    "state": "Active",
    "lvl": 80,
    "version": "1.0.2",
    "name": "Units of Measurement Common Library"
  },
  {
    "id": 187,
    "state": "Active",
    "lvl": 80,
    "version": "1.0.8",
    "name": "Units of Measurement Implementation for Java SE"
  },
  {
    "id": 188,
    "state": "Active",
    "lvl": 80,
    "version": "3.3.0",
    "name": "Commons Net"
  },
  {
    "id": 189,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Basic UI, Fragments: 192"
  },
  {
    "id": 190,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Paper UI, Fragments: 194"
  },
  {
    "id": 191,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "Hue Emulation Service"
  },
  {
    "id": 192,
    "state": "Resolved",
    "lvl": 75,
    "version": "2.4.0.201810032130",
    "name": "openHAB Basic UI Fragment, Hosts: 189"
  },
  {
    "id": 193,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "HABPanel User Interface"
  },
  {
    "id": 194,
    "state": "Resolved",
    "lvl": 75,
    "version": "2.4.0.201810032130",
    "name": "openHAB Paper UI Theme Fragment, Hosts: 190"
  },
  {
    "id": 198,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation API"
  },
  {
    "id": 199,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation commands"
  },
  {
    "id": 200,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Core"
  },
  {
    "id": 201,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Module Core"
  },
  {
    "id": 202,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Media Modules"
  },
  {
    "id": 203,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Module Script"
  },
  {
    "id": 204,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Script Globals"
  },
  {
    "id": 205,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Script RuleSupport"
  },
  {
    "id": 206,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Module Timer"
  },
  {
    "id": 207,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation GSON Parser"
  },
  {
    "id": 208,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation Providers"
  },
  {
    "id": 209,
    "state": "Active",
    "lvl": 80,
    "version": "0.10.0.201809271800",
    "name": "Eclipse SmartHome Automation REST API"
  },
  {
    "id": 239,
    "state": "Installed",
    "lvl": 80,
    "version": "0.10.0.201810051534",
    "name": "Eclipse SmartHome MQTT Binding"
  },
  {
    "id": 240,
    "state": "Installed",
    "lvl": 80,
    "version": "0.10.0.201810051534",
    "name": "Eclipse SmartHome Embedded Mqtt Broker"
  },
  {
    "id": 241,
    "state": "Installed",
    "lvl": 80,
    "version": "0.10.0.201810051534",
    "name": "Eclipse SmartHome MQTT Thing Binding"
  },
  {
    "id": 242,
    "state": "Installed",
    "lvl": 80,
    "version": "0.10.0.201810051534",
    "name": "Eclipse SmartHome MQTT Transport Bundle"
  },
  {
    "id": 243,
    "state": "Active",
    "lvl": 80,
    "version": "1.1.1.201605111122",
    "name": "Swagger Provider"
  },
  {
    "id": 244,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "Jackson-annotations"
  },
  {
    "id": 245,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "Jackson-core"
  },
  {
    "id": 246,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "jackson-databind"
  },
  {
    "id": 247,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "Jackson-dataformat-XML"
  },
  {
    "id": 248,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "Jackson-dataformat-YAML"
  },
  {
    "id": 249,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.5",
    "name": "Jackson-module-JAXB-annotations"
  },
  {
    "id": 250,
    "state": "Active",
    "lvl": 80,
    "version": "18.0.0",
    "name": "Guava: Google Core Libraries for Java"
  },
  {
    "id": 251,
    "state": "Active",
    "lvl": 80,
    "version": "1.5.8",
    "name": "swagger-annotations"
  },
  {
    "id": 252,
    "state": "Active",
    "lvl": 80,
    "version": "1.5.8",
    "name": "swagger-core"
  },
  {
    "id": 253,
    "state": "Active",
    "lvl": 80,
    "version": "1.5.8",
    "name": "swagger-jaxrs"
  },
  {
    "id": 254,
    "state": "Active",
    "lvl": 80,
    "version": "1.5.8",
    "name": "swagger-models"
  },
  {
    "id": 255,
    "state": "Active",
    "lvl": 80,
    "version": "3.19.0.GA",
    "name": "Javassist"
  },
  {
    "id": 256,
    "state": "Active",
    "lvl": 80,
    "version": "3.2.1",
    "name": "Apache Commons Lang"
  },
  {
    "id": 259,
    "state": "Active",
    "lvl": 80,
    "version": "2.4.0.201810032130",
    "name": "openHAB REST Documentation"
  },
  {
    "id": 260,
    "state": "Active",
    "lvl": 80,
    "version": "0.9.10.v20160429-1435",
    "name": "reflections (wrap)"
  },
  {
    "id": 261,
    "state": "Active",
    "lvl": 80,
    "version": "3.1.4",
    "name": "Stax2 API"
  },
  {
    "id": 262,
    "state": "Active",
    "lvl": 80,
    "version": "1.5.8.v20160511-1038",
    "name": "swagger-jersey2-jaxrs (wrap)"
  },
  {
    "id": 263,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome JavaScript Transformation Service"
  },
  {
    "id": 270,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome XPath Transformation Service"
  },
  {
    "id": 271,
    "state": "Active",
    "lvl": 80,
    "version": "2.1.0",
    "name": "json-path"
  },
  {
    "id": 272,
    "state": "Active",
    "lvl": 80,
    "version": "2.2",
    "name": "json-smart"
  },
  {
    "id": 273,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome JSonPath Transformation Service"
  },
  {
    "id": 274,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome RegEx Transformation Service"
  },
  {
    "id": 275,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome Exec Transformation Service"
  },
  {
    "id": 276,
    "state": "Active",
    "lvl": 75,
    "version": "0.10.0.201812160950",
    "name": "Eclipse SmartHome Map Transformation Service"
  }
];

const semantic = [
  { type: "Location", tag: "Indoor", parent: "NO", label: "Indoor", synonyms: [], description: "Anything that is inside a closed building" },
  { type: "Location", tag: "Building", parent: "Indoor", label: "Building", synonyms: ["Buildings"], description: "" },
  { type: "Location", tag: "Garage", parent: "Building", label: "Garage", synonyms: ["Garages"], description: "" },
  { type: "Location", tag: "Floor", parent: "Indoor", label: "Floor", synonyms: ["Floors"], description: "" },
  { type: "Location", tag: "GroundFloor", parent: "Floor", label: "Ground Floor", synonyms: ["Ground Floors", "Downstairs"], description: "" },
  { type: "Location", tag: "FirstFloor", parent: "Floor", label: "First Floor", synonyms: ["First Floors", "Upstairs"], description: "" },
  { type: "Location", tag: "Attic", parent: "Floor", label: "Attic", synonyms: ["Attics"], description: "" },
  { type: "Location", tag: "Basement", parent: "Floor", label: "Basement", synonyms: ["Basements", "Cellar", "Cellars"], description: "" },
  { type: "Location", tag: "Corridor", parent: "Indoor", label: "Corridor", synonyms: ["Corridors"], description: "" },
  { type: "Location", tag: "Room", parent: "Indoor", label: "Room", synonyms: ["Rooms"], description: "" },
  { type: "Location", tag: "Bedroom", parent: "Room", label: "Bedroom", synonyms: ["Bedrooms"], description: "" },
  { type: "Location", tag: "Kitchen", parent: "Room", label: "Kitchen", synonyms: ["Kitchens"], description: "" },
  { type: "Location", tag: "Bathroom", parent: "Room", label: "Bathroom", synonyms: ["Bathrooms", "Bath", "Baths"], description: "" },
  { type: "Location", tag: "LivingRoom", parent: "Room", label: "Living Room", synonyms: ["Living Rooms"], description: "" },
  { type: "Location", tag: "Outdoor", parent: "NO", label: "Outdoor", synonyms: [], description: "" },
  { type: "Location", tag: "Garden", parent: "Outdoor", label: "Garden", synonyms: ["Gardens"], description: "" },
  { type: "Location", tag: "Terrace", parent: "Outdoor", label: "Terrace", synonyms: ["Terraces", "Deck", "Decks"], description: "" },
  { type: "Location", tag: "Carport", parent: "Outdoor", label: "Carport", synonyms: ["Carports"], description: "" },
  { type: "Property", tag: "Temperature", parent: "NO", label: "Temperature", synonyms: ["Temperatures"], description: "" },
  { type: "Property", tag: "Light", parent: "NO", label: "Light", synonyms: ["Lights", "Lighting"], description: "" },
  { type: "Property", tag: "ColorTemperature", parent: "NO", label: "Color Temperature", synonyms: [], description: "" },
  { type: "Property", tag: "Humidity", parent: "NO", label: "Humidity", synonyms: ["Moisture"], description: "" },
  { type: "Property", tag: "Presence", parent: "NO", label: "Presence", synonyms: [], description: "" },
  { type: "Property", tag: "Pressure", parent: "NO", label: "Pressure", synonyms: [], description: "" },
  { type: "Property", tag: "Smoke", parent: "NO", label: "Smoke", synonyms: [], description: "" },
  { type: "Property", tag: "Noise", parent: "NO", label: "Noise", synonyms: [], description: "" },
  { type: "Property", tag: "Rain", parent: "NO", label: "Rain", synonyms: [], description: "" },
  { type: "Property", tag: "Wind", parent: "NO", label: "Wind", synonyms: [], description: "" },
  { type: "Property", tag: "Water", parent: "NO", label: "Water", synonyms: [], description: "" },
  { type: "Property", tag: "CO2", parent: "NO", label: "CO2", synonyms: ["Carbon Dioxide"], description: "" },
  { type: "Property", tag: "CO", parent: "NO", label: "CO", synonyms: ["Carbon Monoxide"], description: "" },
  { type: "Property", tag: "Energy", parent: "NO", label: "Energy", synonyms: [], description: "" },
  { type: "Property", tag: "Power", parent: "NO", label: "Power", synonyms: [], description: "" },
  { type: "Property", tag: "Voltage", parent: "NO", label: "Voltage", synonyms: [], description: "" },
  { type: "Property", tag: "Current", parent: "NO", label: "Current", synonyms: [], description: "" },
  { type: "Property", tag: "Frequency", parent: "NO", label: "Frequency", synonyms: [], description: "" },
  { type: "Property", tag: "Gas", parent: "NO", label: "Gas", synonyms: [], description: "" },
  { type: "Property", tag: "SoundVolume", parent: "NO", label: "Sound Volume", synonyms: [], description: "" },
  { type: "Property", tag: "Oil", parent: "NO", label: "Oil", synonyms: [], description: "" },
  { type: "Point", tag: "Alarm", parent: "NO", label: "Alarm", synonyms: [], description: "" },
  { type: "Point", tag: "Control", parent: "NO", label: "Control", synonyms: [], description: "" },
  { type: "Point", tag: "Switch", parent: "Control", label: "Switch", synonyms: [], description: "" },
  { type: "Point", tag: "Measurement", parent: "NO", label: "Measurement", synonyms: [], description: "" },
  { type: "Point", tag: "Setpoint", parent: "NO", label: "Setpoint", synonyms: [], description: "" },
  { type: "Point", tag: "Status", parent: "NO", label: "Status", synonyms: [], description: "" },
  { type: "Point", tag: "LowBattery", parent: "Status", label: "LowBattery", synonyms: [], description: "" },
  { type: "Point", tag: "OpenState", parent: "Status", label: "OpenState", synonyms: [], description: "" },
  { type: "Point", tag: "Tampered", parent: "Status", label: "Tampered", synonyms: [], description: "" },
  { type: "Point", tag: "OpenLevel", parent: "Status", label: "OpenLevel", synonyms: [], description: "" },
  { type: "Point", tag: "Tilt", parent: "Status", label: "Tilt", synonyms: [], description: "" },
  { type: "Equipment", tag: "Battery", parent: "NO", label: "Battery", synonyms: ["Batteries"], description: "" },
  { type: "Equipment", tag: "Blinds", parent: "NO", label: "Blinds", synonyms: ["Rollershutter", "Rollershutters", "Roller shutter", "Roller shutters", "Shutter", "Shutters"], description: "" },
  { type: "Equipment", tag: "Camera", parent: "NO", label: "Camera", synonyms: ["Cameras"], description: "" },
  { type: "Equipment", tag: "Car", parent: "NO", label: "Car", synonyms: ["Cars"], description: "" },
  { type: "Equipment", tag: "CleaningRobot", parent: "NO", label: "Cleaning Robot", synonyms: ["Cleaning Robots", "Vacuum robot", "Vacuum robots"], description: "" },
  { type: "Equipment", tag: "Door", parent: "NO", label: "Door", synonyms: ["Doors"], description: "" },
  { type: "Equipment", tag: "FrontDoor", parent: "Door", label: "Front Door", synonyms: ["Front Doors", "Frontdoor", "Frontdoors"], description: "" },
  { type: "Equipment", tag: "GarageDoor", parent: "Door", label: "Garage Door", synonyms: ["Garage Doors"], description: "" },
  { type: "Equipment", tag: "HVAC", parent: "NO", label: "HVAC", synonyms: ["Heating", "Ventilation", "Air Conditioning", "A/C", "A/Cs", "AC"], description: "" },
  { type: "Equipment", tag: "Inverter", parent: "NO", label: "Inverter", synonyms: ["Inverters"], description: "" },
  { type: "Equipment", tag: "LawnMower", parent: "NO", label: "Lawn Mower", synonyms: ["Lawn Mowers"], description: "" },
  { type: "Equipment", tag: "Lightbulb", parent: "NO", label: "Lightbulb", synonyms: ["Lightbulbs", "Bulb", "Bulbs", "Lamp", "Lamps", "Lights", "Lighting"], description: "" },
  { type: "Equipment", tag: "Lock", parent: "NO", label: "Lock", synonyms: ["Locks"], description: "" },
  { type: "Equipment", tag: "MotionDetector", parent: "NO", label: "Motion Detector", synonyms: ["Motion Detectors", "Motion sensor", "Motion sensors"], description: "" },
  { type: "Equipment", tag: "NetworkAppliance", parent: "NO", label: "Network Appliance", synonyms: ["Network Appliances"], description: "" },
  { type: "Equipment", tag: "PowerOutlet", parent: "NO", label: "Power Outlet", synonyms: ["Power Outlets", "Outlet", "Outlets"], description: "" },
  { type: "Equipment", tag: "Projector", parent: "NO", label: "Projector", synonyms: ["Projectors", "Beamer", "Beamers"], description: "" },
  { type: "Equipment", tag: "RadiatorControl", parent: "NO", label: "Radiator Control", synonyms: ["Radiator Controls", "Radiator", "Radiators"], description: "" },
  { type: "Equipment", tag: "Receiver", parent: "NO", label: "Receiver", synonyms: ["Receivers", "Audio Receiver", "Audio Receivers", "AV Receiver", "AV Receivers"], description: "" },
  { type: "Equipment", tag: "RemoteControl", parent: "NO", label: "Remote Control", synonyms: ["Remote Controls"], description: "" },
  { type: "Equipment", tag: "Screen", parent: "NO", label: "Screen", synonyms: ["Screens", "Television", "Televisions", "TV", "TVs"], description: "" },
  { type: "Equipment", tag: "Siren", parent: "NO", label: "Siren", synonyms: ["Sirens"], description: "" },
  { type: "Equipment", tag: "SmokeDetector", parent: "NO", label: "Smoke Detector", synonyms: ["Smoke Detectors"], description: "" },
  { type: "Equipment", tag: "Speaker", parent: "NO", label: "Speaker", synonyms: ["Speakers"], description: "" },
  { type: "Equipment", tag: "Valve", parent: "NO", label: "Valve", synonyms: ["Valves"], description: "" },
  { type: "Equipment", tag: "WallSwitch", parent: "NO", label: "Wall Switch", synonyms: ["Wall Switches"], description: "" },
  { type: "Equipment", tag: "WebService", parent: "NO", label: "Web Service", synonyms: ["Web Services"], description: "" },
  { type: "Equipment", tag: "Window", parent: "NO", label: "Window", synonyms: ["Windows"], description: "" },
  { type: "Equipment", tag: "WhiteGood", parent: "NO", label: "White Good", synonyms: ["White Goods"], description: "" }
];

async function addManualExtensions(tx) {
  const store = tx.objectStore('manualextensions');
  await store.clear();
  const data = [
    {
      "id": "binding-avmfritz",
      "label": "AVM FRITZ!Box Binding",
      "filepath": "binding-avmfritz-2.4.0.SNAPSHOT.jar",
      "version": "2.4.0.SNAPSHOT",
      "link": "https://www.openhab.org/addons/bindings/avmfritz/",
      "enabled": true,
      "installed": 1546950225013,
      "type": "binding"
    },
    {
      "id": "binding-airvisualnode",
      "label": "AirVisual Node Binding",
      "filepath": "binding-airvisualnode-2.4.0.SNAPSHOT.jar",
      "version": "2.4.0.SNAPSHOT",
      "link": "https://www.openhab.org/addons/bindings/airvisualnode/",
      "enabled": true,
      "installed": 1546950221013,
      "type": "binding"
    },
    {
      "id": "webinterface",
      "label": "Paper UI NG Alpha",
      "filepath": "webinterface-paperui-ng-0.1.zip",
      "version": "0.1",
      "link": "https://davidgraeff.github.io/paperui-ng/",
      "enabled": true,
      "installed": 1546950125013,
      "type": "webinterface"
    }
  ];
  for (let d of data) await store.add(d);
}

async function addExtensionRepositories(tx) {
  const scriptStore = tx.objectStore('extension-repositories');
  await scriptStore.clear();
  const scripts = [
    {
      "extensionservice": "org.openhab.addons",
      "label": "Release builds",
      "description": "The main maven repository for openHAB releases",
      "url": "https://dl.bintray.com/openhab/mvn",
      "type": "maven_repository",
      "fixed": true,
      "enabled": false
    },
    {
      "extensionservice": "org.openhab.addons",
      "label": "Milestone builds",
      "description": "openHAB Milestone repository",
      "url": "https://openhab.jfrog.io/openhab/online-repo-milestone/2.5",
      "type": "maven_repository",
      "fixed": true,
      "enabled": true
    },
    {
      "extensionservice": "org.openhab.addons",
      "label": "Legacy OH1 addons",
      "description": "Add-ons in this repository have a newer version already. For compatibility and old installations you might want to enable this however.",
      "url": "mvn:org.openhab.distro/openhab-addons-legacy/%version%/xml/features",
      "type": "karaf_features",
      "fixed": true,
      "enabled": false
    },
    {
      "id": "eclipse_marketplace_rules",
      "label": "Eclipse Marketplace",
      "description": "Bindings, Rule Templates, Voice services on the Eclipse Marketplace.",
      "url": "https://marketplace.eclipse.org/taxonomy/term/4988%2C4396/api/p?client=org.eclipse.smarthome",
      "type": "bundles",
      "fixed": true,
      "enabled": true
    },
  ];
  for (let d of scripts) await scriptStore.add(d);
}

async function addScripts(tx) {
  const scriptStore = tx.objectStore('scripts');
  await scriptStore.clear();
  const scripts = [
    {
      "filename": "a_script_file.js",
      "description": "My first rule",
      "mime": "application/javascript",
    }
  ];
  for (let d of scripts) await scriptStore.add(d);
}

async function addPersistenceServices(tx) {
  const store = tx.objectStore('persistence-services');
  await store.clear();
  const data = [
    {
      "id": "influxdb",
      "description": "This service allows you to persist and query states using the InfluxDB time series database.",
      "label": "InfluxDB",
      "configDescriptionURI": "persistence:influxdb",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Every update", id: "onupdate" }
      ]
    },
    {
      "id": "jpa",
      "description": "This service allows you to persist state updates using a SQL or NoSQL database through the Java Persistence API",
      "label": "Java Persistence API",
      "configDescriptionURI": "persistence:jpa",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Every update", id: "onupdate" }
      ]
    },
    {
      "id": "dynamodb",
      "description": "This service allows you to persist state updates using the Amazon DynamoDB database. ",
      "label": "Amazon DynamoDB Persistence",
      "configDescriptionURI": "persistence:dynamodb",
      strategies: [
        { label: "Every change", id: "onchange" }
      ]
    },
    {
      "id": "mapdb",
      "description": "The mapdb Persistence Service is based on simple key-value store that only saves the last value. The intention is to use this for restoreOnStartup items because all other persistence options have their drawbacks if values are only needed for reload.",
      "label": "mapdb",
      "configDescriptionURI": "persistence:mapdb",
      strategies: [
        { label: "Every change", id: "onchange" },
        { label: "Restore on startup", id: "restore" }
      ]
    },
    {
      "id": "rrd4j",
      "description": "rrd4j is a round-robin database and does not grow in size - it has a fixed allocated size, which is used. This is accomplished by doing data compression, which means that the older the data is, the less values are available. So while you might have a value every minute for the last 24 hours, you might only have one every day for the last year.",
      "label": "rrd4j",
      "configDescriptionURI": "persistence:rrd4j",
      strategies: [
        { label: "Cron strategy", id: "cron" }
      ]
    }
  ];
  for (let d of data) await store.add(d);
}

async function addPersistence(tx) {
  const store = tx.objectStore('persistence');
  await store.clear();
  const data = [
    {
      "uid": "e7773915-cd05-4376-813f-b35de6a98bf2",
      "annotation": "Used for charting",
      "label": "InfluxDB Charting",
      "serviceid": "influxdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onchange"]
    },
    {
      "uid": "30179c6a-2a3c-4435-a7ff-c7448e6df17d",
      "annotation": "Allows an overview of when my items updated to a new value",
      "label": "InfluxDB History",
      "serviceid": "influxdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onupdate"]
    },
    {
      "uid": "8c7e5ce1-578c-4ac4-bc9e-fd20ab6be70e",
      "annotation": "Stores all items to mapDB for a later restart",
      "label": "MapDB Store",
      "serviceid": "mapdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["onchange"]
    },
    {
      "uid": "66e7b0d9-3de6-479a-9873-a5347878923d",
      "annotation": "Restores all my items on startup",
      "label": "MapDB Restore",
      "serviceid": "mapdb",
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": [],
      "strategy": ["restore"]
    },
    {
      "uid": "790073db-6a9a-46f8-8ff2-876c37d7afb7",
      "annotation": "Does this and that",
      "label": "rrd4j Charting",
      "serviceid": "rrd4j",
      "items": [],
      "itemPattern": "",
      "strategy": ["cron"]
    }
  ];
  for (let d of data) await store.add(d);
}

async function addScriptTypes(tx) {
  const store = tx.objectStore('script-types');
  await store.clear();
  const data = [
    {
      "id": "javascript",
      "mime": "application/javascript",
      "extension": "js",
      "label": "Javascript ES6 (Nashorn)",
      "description": ""
    },
    {
      "id": "jython",
      "mime": "application/python",
      "extension": "py",
      "label": "Jython (Python 2.6 dialect)",
      "description": ""
    }
  ];
  for (let d of data) await store.add(d);
}

async function addItemTypes(tx) {
  const store = tx.objectStore('item-types');
  await store.clear();
  const data = [
    {
      id: "Color", label: "Color",
      description: "Color information"
    },
    {
      id: "Contact", label: "Contact",
      description: "Read-only status of contacts, e.g. door/window contacts.",
      group: true,
      allowedStates: ["CLOSED", "OPEN"]
    },
    {
      id: "DateTime", label: "DateTime",
      description: "Stores date and time",
      group: true
    },
    {
      id: "Dimmer", label: "Dimmer",
      description: "Percentage value, typically used for dimmers",
      group: true, percentage: true, number: true,
      commands: ["INCREASE", "DECREASE", "OFF", "ON"]
    },
    {
      id: "Image", label: "Image",
      description: "Binary data of an image"
    },
    {
      id: "Location", label: "Location",
      description: "GPS coordinates"
    },
    {
      id: "Number", label: "Number",
      description: "Values in number format",
      group: true, number: true
    },
    {
      id: "Player", label: "Player",
      description: "Allows control of players (e.g. audio players)",
      allowedStates: ["PLAY", "PAUSE"], commands: ["PLAY", "PAUSE", "STOP"]
    },
    {
      id: "Rollershutter", label: "Rollershutter",
      description: "Roller shutter Item, typically used for blinds",
      group: true, percentage: true, number: true,
      commands: ["INCREASE", "DECREASE", "UP", "DOWN", "STOP", "MOVE", "OFF", "ON"]
    },
    {
      id: "String", label: "String",
      description: "Stores texts"
    },
    {
      id: "Switch", label: "Switch",
      description: "Used for anything that needs to be switched ON and OFF",
      group: true,
      allowedStates: ["ON", "OFF"], commands: ["ON", "OFF"]
    },
    {
      id: "Group", label: "Group",
      description: "Item to nest other items / collect them in groups"
    },
  ];
  for (let d of data) await store.add(d);
}

async function addItemGroupFunctionTypes(tx) {
  const store = tx.objectStore('item-group-function-types');
  await store.clear();
  const data = [
    {
      id: "AND",
      label: "All state S1 ⊶ S1",
      description: "If all members have state S1, this group has state S1 else state S2",
      compatible: [],
      params: [
        { type: "allowedState", label: "S1", description: "State 1" },
        { type: "allowedState", label: "S2", description: "State 2" }
      ]
    },
    {
      id: "NAND",
      label: "All state S1 ⊶ S2",
      description: "If all members have state S1, this group has state S2 else state S1",
      compatible: [],
      params: [
        { type: "allowedState", label: "S1", description: "State 1" },
        { type: "allowedState", label: "S2", description: "State 2" }
      ]
    },
    {
      id: "OR",
      label: "Any state S1 ⊶ S1",
      description: "If any member is state S1, this group has state S1 else state S2",
      compatible: [],
      params: [
        { type: "allowedState", label: "S1", description: "State 1" },
        { type: "allowedState", label: "S2", description: "State 2" }
      ]
    },
    {
      id: "NOR",
      label: "Any state S1 ⊶ S2",
      description: "If any member is state S1, this group has state S2 else state S1",
      compatible: [],
      params: [
        { type: "allowedState", label: "S1", description: "State 1" },
        { type: "allowedState", label: "S2", description: "State 2" }
      ]
    },
    {
      id: "EQUALITY",
      label: "Equal",
      description: "Sets the group state to all members equal state otherwise to UNDEF",
      compatible: [],
    },
    {
      id: "SUM",
      label: "Sum",
      description: "Computes the sum of all group members",
      compatible: ["Rollershutter", "Dimmer", "Number"],
    },
    {
      id: "AVG",
      label: "Average",
      description: "Computes the average of all group members",
      compatible: ["Rollershutter", "Dimmer", "Number"],
    },
    {
      id: "MIN",
      label: "Minimum",
      description: "Computes the minimum of all group members",
      compatible: ["Rollershutter", "Dimmer", "Number"],
    },
    {
      id: "MAX",
      label: "Maximum",
      description: "Computes the maximum of all group members",
      compatible: ["Rollershutter", "Dimmer", "Number"],
    },
    {
      id: "LATEST",
      label: "Latest",
      description: "Computes the latest of all group members",
      compatible: ["DateTime"],
    },
    {
      id: "EARLIEST",
      label: "Earliest",
      description: "Computes the earliest of all group members",
      compatible: ["DateTime"],
    },
    {
      id: "COUNT",
      label: "Count",
      description: "Sets the state to the number of members matching the given regular expression with their states.",
      compatible: [],
      params: [
        { type: "regex", label: "Regex", description: "A regular expression. '.*' for example would match all states." },
      ]
    },
  ];
  for (let d of data) await store.add(d);
}
async function addIconSet(tx) {
  const store = tx.objectStore('icon-set');
  await store.clear();
  for (let d of iconset) await store.add(d);
}

async function addUserInterfaces(tx) {
  const store = tx.objectStore('user-interfaces');
  await store.clear();
  const data = [
    {
      "id": "restapidoc",
      "image": "./doc/images/dashboardtile.png",
      "link": "./doc/index.html",
      "label": "REST Api",
      "description": "Interact with the openHAB REST API",
      "type": "tool"
    },
    {
      "id": "habpanel",
      "image": "./habpanel/tile.png",
      "link": "./habpanel/index.html",
      "label": "HABPanel",
      "description": "HABPanel shines on larger screens like tablets. It is a widget based user interface.",
      "type": "primary"
    },
    {
      "id": "paperui",
      "image": "./paperui/img/dashboardtile.png",
      "link": "./paperui/index.html",
      "label": "Paper UI",
      "description": "The veteran of setup interfaces",
      "type": "legacy"
    }
  ];
  for (let d of data) await store.add(d);
}
async function addOSGIbundles(tx) {
  const store = tx.objectStore('bundle-status');
  await store.clear();
  for (let d of osgibundles) await store.add(d);
}

async function addAbout(tx) {
  const store = tx.objectStore('about');
  await store.clear();
  await store.add({
    name: "openHAB",
    version: "2.5M1",
    builddate: Date.now(),
    distribution: {
      name: "openhabian",
      version: "1.4.1",
      url: "https://www.openhab.org/docs/installation/openhabian.html"
    }
  });
}


async function addUserRoles(tx) {
  const store = tx.objectStore('user-roles');
  await store.clear();
  const data = [
    {
      "id": "admin",
      "label": "Administrator",
      "description": "Interact with the openHAB REST API",
      "passwordhash": "123",
      "restEndpoints": [],
      "items": [],
      "itemByNamePattern": ".*",
      "itemByLabelPattern": "",
      "itemByTags": [],
    },
    {
      "id": "grandma",
      "label": "Grandma",
      "description": "Restricted access to kitchen only",
      "passwordhash": "123",
      "restEndpoints": ["items"],
      "items": [],
      "itemByNamePattern": "",
      "itemByLabelPattern": "",
      "itemByTags": ["kitchen"],
    },
  ];
  for (let d of data) await store.add(d);
}
async function addSemanticTags(tx) {
  const store = tx.objectStore('semantic-tags');
  await store.clear();
  for (let d of semantic) await store.add(d);
}


/**
 * Block live REST request for these tables
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
const blockLiveDataFromTables = ['manualextensions', 'scripts', 'persistence-services',
  'persistence', 'script-types', "item-types", "item-group-function-types", "extension-repositories",
  "icon-set", "user-interfaces", "bundle-status", 'user-roles', "about", "semantic-tags"];

/**
 * This methods implements hacks!
 * It creates REST endpoints that are not yet in the mainline openHAB.
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
async function hack_addNotYetSupportedStoreData(db) {
  const tx = db.transaction(blockLiveDataFromTables, 'readwrite');
  addManualExtensions(tx);
  addExtensionRepositories(tx);
  addScripts(tx);
  addPersistenceServices(tx);
  addPersistence(tx);
  addScriptTypes(tx);
  addItemTypes(tx);
  addItemGroupFunctionTypes(tx);
  addIconSet(tx);
  addUserInterfaces(tx);
  addOSGIbundles(tx);
  addUserRoles(tx);
  addAbout(tx);
  addSemanticTags(tx);
  return tx.complete.catch(e => { console.warn("addNotYetSupportedStoreData failed", e); throw e });
}

const randomNames = [
  {
    "name": "Warner Wong"
  },
  {
    "name": "Kara Bolton"
  },
  {
    "name": "Hillary Castro"
  },
  {
    "name": "Kay Mcmahon"
  },
  {
    "name": "Fitzgerald Lynn"
  },
  {
    "name": "Andrews Wilkerson"
  },
  {
    "name": "Manning Phelps"
  },
  {
    "name": "Cantu Peck"
  },
  {
    "name": "Rochelle Henson"
  }
];

const randomDesc = [
  {
    "about": "Tempor velit irure in ad laborum ex Lorem. Officia sint velit eu pariatur deserunt labore amet ea est. Deserunt fugiat reprehenderit culpa aliquip velit fugiat do."
  },
  {
    "about": "Quis cupidatat commodo consequat anim incididunt. Cillum aliqua minim magna amet consectetur labore sint qui nostrud magna nulla eiusmod. Ea exercitation fugiat duis id irure mollit non."
  },
  {
    "about": "Esse reprehenderit culpa est ipsum quis adipisicing esse. Lorem quis amet non esse et aliquip elit duis ad qui excepteur. Veniam voluptate officia id laboris do in fugiat laborum duis."
  },
  {
    "about": "Eu culpa magna ut in ad quis consequat quis amet velit enim culpa. Est commodo culpa nulla adipisicing. Commodo exercitation cillum enim consequat veniam irure proident non quis dolore duis et tempor sint."
  },
  {
    "about": "Ad deserunt proident velit ea velit enim officia elit. Reprehenderit fugiat labore id veniam et. Ea dolor amet ut ipsum incididunt cillum ullamco id sit laboris enim excepteur."
  },
  {
    "about": "Veniam elit occaecat ipsum velit. Dolor qui exercitation labore reprehenderit dolore. Sunt ut nisi commodo irure duis nostrud adipisicing pariatur enim."
  },
  {
    "about": "Ipsum proident commodo nulla fugiat adipisicing amet nisi fugiat est eu commodo commodo nulla fugiat. Fugiat commodo duis laborum incididunt incididunt dolore amet reprehenderit officia incididunt ut magna. Occaecat non labore esse qui anim reprehenderit veniam sunt dolor reprehenderit qui."
  },
  {
    "about": "Nostrud ullamco exercitation ut tempor non minim laborum. Et non ut aute aliqua nisi aute cupidatat minim incididunt duis et adipisicing. Fugiat exercitation mollit nulla aliqua reprehenderit aute quis ipsum dolore enim."
  },
  {
    "about": "Lorem nisi quis deserunt deserunt laborum aute occaecat do ad laborum anim aute. Velit ullamco elit quis anim cillum sunt anim duis minim. Est sunt dolor aute qui."
  },
  {
    "about": "Id velit laboris dolor veniam consequat non fugiat ut aute cillum esse. Ea incididunt eu et cillum ut et. Ut aliquip deserunt cupidatat mollit ad excepteur."
  }
];

/**
 * This method implements hacks!
 * It contains REST receive rewrite operations to support features that are not yet in
 * the mainline openHAB.
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
function hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry) {
  switch (storename) {
    case "module-types": {
      if (entry.inputs) {
        for (let input of entry.inputs) {
          let compatibleTo = {};
          compatibleTo["java.lang.Object"] = true;
          if (input.type == "org.openhab.core.types.Command") {
            compatibleTo["org.openhab.core.types.State"] = true;
          }
          else if (input.type == "org.openhab.core.types.State") {
            compatibleTo["org.openhab.core.types.Command"] = true;
          }
          else if (input.type == "org.eclipse.smarthome.core.types.Command") {
            compatibleTo["org.eclipse.smarthome.core.types.State"] = true;
          }
          else if (input.type == "org.eclipse.smarthome.core.types.State") {
            compatibleTo["org.eclipse.smarthome.core.types.Command"] = true;
          }
          input.compatibleTo = compatibleTo;
        }
      }
      if (entry.outputs) {
        for (let output of entry.outputs) {
          let compatibleTo = {};
          compatibleTo["java.lang.Object"] = true;
          output.compatibleTo = compatibleTo;
        }
      }
      if (entry.controls) {
        for (let control of entry.controls) {
          if (control.name == "cronExpression") {
            control.context = "cronexpression";
          }
        }
      }
      if (entry.configDescriptions) {
        for (let control of entry.configDescriptions) {
          if (control.name == "cronExpression") {
            control.context = "cronexpression";
          }
        }
      }
      break;
    }
    case "bindings": {
      entry.versioninformation = [];
      entry.version = "2.5M1";
      entry.loglevel = "warn";
      entry.source = "https://github.com/openhab/openhab2-addons/tree/master/addons/binding/org.openhab.binding." + entry.id;
      if (entry.id == "zwave") {
        entry.source = "https://github.com/openhab/org.openhab.binding.zwave/tree/master";
        entry.custompages = [
          {
            "uri": "dummydata/mqtt.html",
            "label": "MQTT Traffic monitor"
          }
        ];
      }
      else if (entry.id == "mqtt") {
        entry.custompages = [
          {
            "uri": "dummydata/mqtt.html",
            "label": "MQTT Traffic monitor"
          }
        ];
        entry.versioninformation = [
          { version: "2.4", message: "You will encounter a mqtt:client not found if configured via textual files. Solution: Restart openHAB after each change." },
          { version: "2.5", message: "The HomeAssistant discovery will not work correctly." }
        ];
      }
      break;
    }
    case "things": {
      entry.actions = [
        { id: "pair", label: "Start pairing", description: "This thing requires a special pairing method" },
        { id: "unpair", label: "Unpair", description: "Removes the association to the remote device" },
      ];
      // Add group property to channels -> for grouping
      if (entry.channels) {
        for (let channel of entry.channels) {
          const [groupid, channelid] = channel.id.split("#");
          if (channelid) channel.group = groupid;
        }
      }
      break;
    }
    case "channel-types": {
      entry.id = entry.UID.split(":")[1];
      break;
    }
    case "profile-types": {
      switch (entry.uid) {
        case "system:default":
          entry.description = "Just pass new Channel values to the linked Item";
          break;
        case "system:follow":
          entry.description = "This channel will apply any Item updates and therefore 'follow' the Items state. You usually want that to synchronize two or more different Binding Channels.";
          break;
        default:
          entry.description = "";
      }
      break;
    }
    // Extend with available versions, authors, description, extended status
    // as well as documentation link and changelog link
    case "extensions": {
      entry.availableVersions = [
        "2.4 - Stable",
        "2.5 - Snapshot"
      ];
      entry.availableVersions.push(entry.version);
      entry.author = randomNames[Math.floor(Math.random() * 9)].name;
      entry.description = randomDesc[Math.floor(Math.random() * 9)].about;
      const installStatus = entry.installed;
      delete entry.installed;
      entry.status = {
        status: installStatus ? "INSTALLED" : "AVAILABLE",
        statusDetail: "INSTALL_DEPENDENCIES",
        description: "Eclipse SmartHome Automation Providers"
      };
      entry.repository = "oh2addons";
      if (entry.id.includes("binding")) {
        const id = entry.id.replace("-", ".");
        entry.url_doc = "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab." + id + "/README.md";
        entry.url_changelog = "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab." + id + "/changelog.md";
      }
      break;
    }
    case "discovery": {
      if (entry.id) break;
      const id = entry;
      entry = {
        id: id,
        background: id != "network" ? true : false,
        duration: 60,
        activeRemaining: id == "network" ? 40 : 0,
      };
      break;
    }
    case "services": {
      break;
    }
  }
  return entry;
}

/**
 * Rewrites an entire store table. This happens after a http fetch.
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
async function hack_rewriteTableToNotYetSupportedStoreLayout(storename, table, store) {
  if (store.host == "demo") {
    return table;
  }

  switch (storename) {
    case "service-config": {
      let service = table.find(e => e.id == "org.openhab.longtimestability");
      if (!service) {
        table.push({
          id: "org.openhab.longtimestability",
          config: { websocketPort: null }
        });
      }
      service = table.find(e => e.id == "org.openhab.logging");
      if (!service) {
        table.push({
          id: "org.openhab.logging",
          config: { websocketPort: null }
        });
      }
      break;
    }
    /**
     * Add backup and long-time stability service to "services" table. Includes extended status info.
     */
    case "services": {
      let service = table.find(e => e.id == "org.openhab.backup");
      if (!service) {
        table.push({
          id: "org.openhab.backup",
          category: "system",
          label: "Backup & Restore",
          multiple: false,
          configDescriptionURI: null,
          status: {
            status: "ONLINE",
            statusDetail: "NONE",
            description: null,
            extended: [
              {
                id: "lastbackup",
                label: "Last backup",
                value: "10.2 MB on Wed Jan 18 2019 07:00:23"
              },
              {
                id: "schedule",
                label: "Schedule",
                value: "At 07:00, Monday through Friday"
              },
              {
                id: "storage",
                label: "Storage",
                value: "Google Drive"
              },
              {
                id: "type",
                label: "Type",
                value: "Full backup, zip"
              }
            ]
          },
          actions: [
            {
              id: "backupnow", label: "Backup now",
              description: "Start a backup, if none is running at the moment"
            },
            {
              id: "prune", label: "Prune backups",
              description: "Remove backups that are older than the configured time"
            },
          ]
        });
      }
      service = table.find(e => e.id == "org.openhab.longtimestability");
      if (!service) {
        table.push({
          id: "org.openhab.longtimestability",
          category: "system",
          label: "Long-Time Stability",
          multiple: false,
          configDescriptionURI: null,
          status: {
            status: "ONLINE",
            statusDetail: "NONE",
            description: null,
            extended: [
              {
                id: "storagesize",
                label: "Used storage size",
                value: "12 MB"
              },
              {
                id: "warning",
                label: "Warning",
                value: "Memory consumption increased more than 100 MB within 7 days."
              },
            ]
          },
          actions: [
            {
              id: "clearcache", label: "Clear cache and restart",
              description: "All cache files are moved and openHAB will be restarted."
            },
            {
              id: "simulatecritical", label: "Simulate critical situation",
              description: "A critical situation is simulated. You should be notified, if the service is configured correctly."
            }
          ]
        });
      }
      service = table.find(e => e.id == "org.openhab.logging");
      if (!service) {
        table.push({
          id: "org.openhab.logging",
          category: "system",
          label: "Logging",
          multiple: false,
          configDescriptionURI: null,
          status: {
            status: "ONLINE",
            statusDetail: "NONE",
            description: null,
            extended: [
              {
                id: "storagesize",
                label: "Used storage size",
                value: "5 MB"
              },
            ]
          },
          actions: [
            {
              id: "clearlog", label: "Clear log files",
              description: "All log files are emptied."
            },
          ]
        });
      }
      break;
    }
    /**
     * The module-types entries do not store their own type (what the heck??).
     * So we need to http GET all three endpoints, for each type one, and compare all
     * entries to those three sets. Tedious.
     */
    case "module-types": {
      let uris = [store.host + "/rest/module-types?type=action",
      store.host + "/rest/module-types?type=condition",
      store.host + "/rest/module-types?type=trigger"];
      let sets = [];
      for (let uri of uris) {
        const response = await fetchWithTimeout(uri);
        const jsonList = await response.json();
        let set = new Set();
        for (let entry of jsonList) set.add(entry.uid);
        sets.push(set);
      }
      for (let entry of table) {
        if (sets[0].has(entry.uid)) {
          entry.type = "action";
        }
        else if (sets[1].has(entry.uid)) {
          entry.type = "condition";
        }
        else if (sets[2].has(entry.uid)) {
          entry.type = "trigger";
        }
      }
      break;
    }
  }
  return table;
}

/**
 * This structure contains all table rows that should be blocked from receiving REST updates.
 * 
 * Block some tutorial injected Things, Items, Bindings.
 * Block some for the maintenance page injected, not yet existing, services
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
const blockLiveDataFromTableRows = {
  "inbox": { "demo1": true, "demo2": true },
  "things": { "demo1": true, "demo2": true },
  "rules": { "demo1": true, "demo2": true },
  "items": { "demo1": true, "demo2": true },
  "bindings": { "demo1": true, "demo2": true },
  "services": { "org.openhab.backup": true, "org.openhab.longtimestability": true, "org.openhab.logging": true },
  "service-config": { "org.openhab.backup": true, "org.openhab.longtimestability": true, "org.openhab.logging": true },
};

/**
 * Virtual channel implementation for "thing-channels".
 * 
 * @param {StateWhileRevalidateStore} store The database store 
 * @param {Object} options The options
 * @param {Boolean} [options.force] If set and no cache data is found, http data is waited for and returned
 * @param {String} options.thingUID The thing UID
 * @param {String} objectid The object ID
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
async function VirtualThingChannels (store, options, objectid) {
  if (!options || !options.thingUID) throw new Error("No thingUID set!");
  const thing = await store.get("things", options.thingUID, options);
  const channels = thing.channels;
  channels.thing = thing; // Attach the original thing object to the array
  if (objectid) {
    return channels.find(i => i.uid == objectid);
  } else
    return channels;
}

/**
 * The following table describes all available stores for the model (database). Most
 * of the stores correspond to a REST endpoint. If a rest endpoint does not allow
 * indiviual object requests, it is annotated with "singleRequests: false".
 * 
 * Some stores are pre-loaded on application start, annotated with "onstart: true".
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const tables = [
  { id: "bindings", uri: "rest/bindings", key: "id", singleRequests: false, onstart: true, label: "Bindings" },// ALTERED
  { id: "binding-config", uri: "rest/bindings", urlsuffix: "/config", wrapkey: "config", key: "id" },
  { id: "channel-types", uri: "rest/channel-types", key: "UID", onstart: true },
  { id: "config-descriptions", uri: "rest/config-descriptions", key: "uri" },
  { id: "discovery", uri: "rest/discovery", key: "id", singleRequests: false, label: "Discovery" },// ALTERED
  { id: "extensions", uri: "rest/extensions", key: "id", label: "Extensions" },// ALTERED
  { id: "extension-repositories", uri: "rest/extension-repositories", key: "url", label: "Extension repositories" },// NEW
  { id: "manualextensions", uri: "rest/manualextensions", key: "id", label: "Manual extensions" }, // NEW
  { id: "scripts", uri: "rest/scripts", key: "filename", label: "Scripts" }, // NEW
  { id: "script-types", uri: "rest/script-types", key: "id" }, // NEW
  { id: "user-roles", uri: "rest/user-roles", key: "id", label: "User roles" }, // NEW
  { id: "icon-set", uri: "rest/icon-set", key: null }, // NEW
  { id: "about", uri: "rest/about", key: null }, // NEW
  { id: "virtual-thing-channels", uri: null, key: "uid", virtual: VirtualThingChannels }, // VIRTUAL
  { id: "user-interfaces", uri: "rest/user-interfaces", key: "id", label: "User interfaces" }, // NEW
  { id: "item-types", uri: "rest/item-types", key: "id" }, // NEW
  { id: "semantic-tags", uri: "rest/  semantic-tags", key: null }, // NEW
  { id: "bundle-status", uri: "rest/bundle-status", key: "id", label: "Bundle management" }, // NEW
  { id: "item-group-function-types", uri: "rest/item-group-function-types", key: "id" }, // NEW
  { id: "items", uri: "rest/items", urlsuffix: "?metadata=.*", key: "name", onstart: true, label: "Items" },
  { id: "persistence-services", uri: "rest/persistence-services", key: "id" }, // NEW
  { id: "persistence", uri: "rest/persistence", key: "uid", singleRequests: false, label: "Persistence" }, // ALTERED
  { id: "inbox", uri: "rest/inbox", key: "thingUID", singleRequests: false, label: "Inbox" },
  { id: "links", uri: "rest/links", key: ["itemName", "channelUID"], singleRequests: false, label: "Item linking" },
  { id: "module-types", uri: "rest/module-types", key: "uid" },
  { id: "profile-types", uri: "rest/profile-types", key: "uid", singleRequests: false },
  { id: "rules", uri: "rest/rules", key: "uid", label: "Rules" },
  { id: "services", uri: "rest/services", key: "id", label: "Services" },
  { id: "service-config", uri: "rest/services", urlsuffix: "/config", wrapkey: "config", key: "id" },
  { id: "ruletemplates", uri: "rest/templates", key: "uid" },
  { id: "thing-types", uri: "rest/thing-types", key: "UID", onstart: true },
  { id: "thing-types-extended", uri: "rest/thing-types", key: "UID" }, // Extended variant for single requested data
  { id: "things", uri: "rest/things", key: "UID", onstart: true, label: "Things" }, // ALTERED
  { id: "voice-interpreters", uri: "rest/voice", key: "id", label: "Voice interpreters" },
];

/**
 * The current DB version.
 * Whenever the data table layout or rewrite-data is changed, this need to be increased.
 * It will force the indexed db to be cleared out and rebuild.
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const dbversion = 53;

/** 
 * This is an associative map of storenames to store-layout descriptions.
 * @const
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
const tableIDtoEntry = Object.freeze(tables.reduce((acc, t) => { acc[t.id] = t; return acc; }, {}));

/**
 * This is the frontends backend storage / cache for the OH REST interface. It is implemented
 * in a state-while-revalidate strategy, so for each get/getAll we first return what we have
 * in the database and perform a REST request as well. The REST response is inserted into the
 * database asynchronously at receive time and if any changes are detected, those are
 * propagated via events.
 * 
 * A connection to the Server-Send-Events endpoint is also established (/rest/events). Received
 * changes are also inserted into the database and propagated via events.
 * 
 * ## Events
 * 
 * The following events are dispatched:
 * 
 * - "connectionEstablished"
 * - "connectionLost"
 * - "storeItemChanged" (Event details: value, storename)
 * - "storeItemAdded" (Event details: value, storename)
 * - "storeItemRemoved" (Event details: value, storename)
 * - "storeChanged" (Event details: value, storename)
 * 
 * ## Sorting / Filtering
 * 
 * Sorting / Filtering / Limiting is not performed in here, because indexed DB does not provide
 * those features. Those operations are performed on a full getAll() data set. Find it performed in "index.js".
 * 
 * ## Change detection / Diffing
 * 
 * If we first return a cached list of items in `getAll` and soon after notify about the received list of items
 * we cause double work for the Views. To implement the state-while-revalidate strategy in a more optimal
 * way, we perform a change-detection between the received list of items and the stored one.
 * 
 * A received REST response might have json properties stored in a different order than what we have
 * in the database. A naive object comparision will always find the cache and REST response to be different.
 * 
 * Therefore received data and cached data are diff'ed by hand, see `CompareTwoDataSets`.
 * That way we can tell the view exactly which item in a list of items has changed.
 * 
 * In average that leads to a fast retrival of data on a `get` and `getAll` call and one or
 * two notifications afterwards about a changed single item in the potentially huge list.
 * 
 * **TODO:** This store class contains the indexedDB interface ("get","getAll") code as well
 * as http database refresh code ("performRESTandNotify" etc). To honour separation of
 * concerns this should be split into those two parts.
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
class StateWhileRevalidateStore extends EventTarget {
  constructor() {
    super();
    this.activeRESTrequests = {};
    this.connected = false;
    this.throttleTimeMS = 2000; // Don't request the same REST url again for this throttle time
    this.expireDurationMS = 1000 * 60 * 60; // 1 hour cache for `getAll`
    this.lastRefresh = {}; // Will contain entries like url:time where time is Date.now()-like.
  }

  /**
   * Closes the database connection and the server-send-event connection for updates.
   */
  dispose() {
    this.activeRESTrequests = {};
    if (this.evtSource) { this.evtSource.onerror = null; this.evtSource.onmessage = null; this.evtSource.close(); }
    if (this.db) {
      db.close();
      delete this.db;
    }  }

  /**
   * Waits for the database to be ready, refreshes some REST endpoints and starts Server-Send-Events
   * Start Server Send Events.
   * 
   * @param {String} host The host to connect to
   * @returns {Promise} Return a promise that resolves to true on a successful connection and an Error otherwise.
   */
  async reconnect(host) {
    if (this.host != host) {
      await this.connectToDatabase(host);
      await this.removeTutorialData().catch(e => console.error("Remove tutorial data failed", e));
      this.host = host;
    }

    this.activeRESTrequests = {};

    if (this.evtSource) { this.evtSource.onerror = null; this.evtSource.onmessage = null; this.evtSource.close(); }

    if (this.host == "demo") {
      return fetchWithTimeout("../dummydata/demodata.json")
        .then(response => response.json())
        .then(async json => {
          const stores = Object.keys(json);
          for (let storename of stores) {
            try {
              await this.initialStoreFill(storename, json[storename], false);
            } catch (e) {
              console.warn("Failed to restore demo table", storename, e);
            }
          }
          this.connected = true;
          this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: this.host }));
          return true;
        }).catch(e => {
          this.connected = false;
          this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type: 404, message: e.toString() } }));
          throw e;
        });
    }

    // Fetch all endpoints in parallel, replace the stores with the received data
    const requests = tables
      .filter(item => item.onstart)
      .map(item => fetchWithTimeout(this.host + "/" + item.uri)
        .catch(e => { console.warn("Failed to fetch", this.host + "/" + item.uri); throw e; })
        .then(response => response.json())
        .then(json => this.initialStoreFill(item.id, json, true))
        .catch(e => { console.warn("Failed to fill", item.id); throw e; })
      );

    // Wait for all promises to complete and start server-send-events
    return Promise.all(requests).then(() => {
      this.evtSource = new EventSource(this.host + "/rest/events");
      this.evtSource.onmessage = this.sseMessageReceived.bind(this);
      this.evtSource.onerror = this.sseMessageError.bind(this);
    }).then(() => {
      this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: this.host }));
      this.connected = true;
      return true;
    }).catch(e => {
      this.connected = false;
      const message = e.toString();
      let type = 404;
      if (message.includes("TypeError") && !message.includes("Failed to fetch")) {
        type = 4041; // custom error code for Cross-orgin access
      }
      this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type, message } }));
      throw e;
    });
  }
  /**
   * First retrieve fresh data for all tables, then dump the entire indexeddb.
   * @returns {Object} Returns an object containing all database entries.
   */
  async dump() {
    if (this.dumpRunning) return;
    let dumpobject = {};
    this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 0 } }));

    try {
      this.dumpRunning = true;
      const requests = tables.filter(item => item.uri !== undefined && !item.urlsuffix);
      let counter = 0;
      for (let item of requests) {
        await this.getAll(item.id, { force: true });
        ++counter;
        this.dispatchEvent(new CustomEvent("dump", { detail: { progress: Math.floor(counter * 80 / requests.length) } }));
      }

      let thingTypes = await this.getAll("thing-types", { force: true });
      for (let thingType of thingTypes) {
        await this.get("thing-types-extended", thingType.UID, { force: true });
      }
      this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 90 } }));

      let bindings = await this.getAll("bindings", { force: true });
      for (let binding of bindings) {
        await this.get("binding-config", binding.id, { force: true });
      }
      this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 91 } }));

      let services = await this.getAll("services", { force: true });
      for (let service of services) {
        await this.get("service-config", service.id, { force: true });
      }

      this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 92 } }));

      const stores = tables.map(e => e.id);
      const tx = this.db.transaction(stores, 'readonly');
      counter = 0;
      for (let store of stores) {
        dumpobject[store] = await tx.objectStore(store).getAll();
        ++counter;
        this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 92 + Math.floor(counter * 8 / stores.length) } }));
      }
      this.dispatchEvent(new CustomEvent("dump", { detail: { progress: 100, done: true } }));
    } catch (e) {
      this.dispatchEvent(new CustomEvent("dump", { detail: { done: true, error: e } }));
      console.warn("Dump incomplete!", e);
    } finally {
      this.dumpRunning = false;
    }
    return dumpobject;
  }

  /**
   * Configures the database
   * 
   * @param {Number} expireDurationMS The cache expire time in milliseconds
   * @param {Number} throttleTimeMS The throttle time in milliseconds
   */
  async configure(expireDurationMS, throttleTimeMS) {
    this.throttleTimeMS = throttleTimeMS;
    this.expireDurationMS = expireDurationMS;
    return true;
  }

  convertToMap(tableLayout, options, values) {
    if (options.asmap === true) {
      const KEY = tableLayout.key;
      return values.then(arraydata => arraydata.reduce((a, v) => (a[v[KEY]] = v, a), {}))
    } else if (options.asmap) {
      const KEY = options.asmap;
      return values.then(arraydata => arraydata.reduce((a, v) => {
        const INDEX = v[KEY];
        if (!a[INDEX]) a[INDEX] = [];
        a[INDEX].push(v);
        return a;
      }, {}))
    }

    return values;
  }

  /**
   * Request an array of items from a table (rest endpoint).
   * This method will first return what is found in the cache
   * (if the cache is still valid) and then also perform
   * a REST request for fresh data.
   * 
   * @param {String} storename The table name
   * @param {Object} options Options
   * @param {Boolean} options.force If the cache has no data, wait for
   *  HTTP received data
   * @param {Boolean} options.asmap Returns a map instead of an array,
   *  mapping from the index key to the entry
   */
  async getAll(storename, options) {
    const tableLayout = tableIDtoEntry[storename];
    if (tableLayout.virtual) { // virtual tables support
      return this.convertToMap(tableLayout, options, tableLayout.virtual(this, options));
    }

    const tx = this.db.transaction(storename, 'readonly');
    let val = tx.objectStore(storename).getAll();

    val = this.convertToMap(tableLayout, options, val);

    try {
      await tx.complete;
    } catch (e) {
      console.warn("Failed to read", storename, objectid);
      val = null;
    }
    if (this.blockRESTrequest(storename))
      return val;

    const uri = tableLayout.uri;
    if (!uri) {
      console.warn("No URI for", storename);
      throw new Error("No URI for " + storename);
    }

    if (this.cacheStillValid(uri)) {
      return val;
    }

    // Return cached value but also request a new value
    let newVal = this.performRESTandNotify(uri)
      .catch(e => { console.warn("Failed to fetch", uri); throw e; })
      .then(json => { if (!Array.isArray(json)) throw new Error("Returned value is not an array"); return json; })
      .then(json => this.replaceStore(storename, json));

    newVal = this.convertToMap(tableLayout, options, newVal);
    if (options.force) { // forced: if no cached OR empty cache value, return http promise
      if (!val || val.length == 0) return newVal;
    }
    return val || newVal; // If no cached value return http promise
  }

  /**
   * Request a single item from a table (rest endpoint).
   * This method will first return what is found in the cache
   * (if the cache is still valid) and then also perform
   * a REST request for fresh data.
   * 
   * Some tables do not have an index key or a REST endpoint
   * for requesting a single item. The entire table is fetched
   * then and filtered afterwards.
   * 
   * @param {String} storename The table name
   * @param {String} objectid The object id
   * @param {Object} options Options
   * @param {Boolean} options.force If the cache has no data, wait for
   *  HTTP received data
   */
  async get(storename, objectid, options) {
    if (!objectid) throw new Error("No object id set for " + storename);
    const tableLayout = tableIDtoEntry[storename];
    if (tableLayout.virtual) { // virtual tables support
      return tableLayout.virtual(this, options, objectid);
    }

    const tx = this.db.transaction(storename, 'readonly');
    let val = tx.objectStore(storename).get(objectid);


    val = unwrapIfRequired(tableLayout, val);

    try {
      await tx.complete;
    } catch (e) {
      console.warn("Failed to read", storename, objectid);
      val = null;
    }
    if (this.blockRESTrequest(storename, objectid))
      return val;

    let uri = tableLayout.uri;
    if (!uri) {
      console.warn("No URI for", storename);
      throw new Error("No URI for " + storename);
    }

    if (tableLayout.singleRequests !== false) {
      uri += "/" + objectid;
    }

    if (tableLayout.urlsuffix) {
      uri += tableLayout.urlsuffix;
    }

    if (this.cacheStillValid(uri)) {
      return val;
    }

    // Return cached value but also request a new value. If cached==null return only new value
    let newVal = this.performRESTandNotify(uri, false)
      .catch(e => { console.warn("Fetch failed for", uri); throw e; })
      .then(json => tableLayout.singleRequests === false ? extractFromArray(storename, objectid, json) : json)
      .then(json => this.insertIntoStore(storename, wrapIfRequired(tableLayout, objectid, json)))
      .then(json => unwrapIfRequired(tableLayout, json));

    if (options.force) { // forced: if no cached OR empty cache value, return http promise
      if (!val || val[tableLayout.key] != objectid) return newVal;
    }
    return val || newVal; // If no cached value return http promise
  }

  injectTutorialData(storename, objectdata) {
    this.lastRefresh[tableIDtoEntry[storename].uri] = "block";
    this.insertIntoStore(storename, objectdata);
  }

  async removeTutorialData() {
    await ignoreNotFound(this.removeFromStore("bindings", { "id": "demo1" }));
    await ignoreNotFound(this.removeFromStore("inbox", { "thingUID": "demo1:demo1" }));
    await ignoreNotFound(this.removeFromStore("discovery", { "id": "demo1" }));
    await ignoreNotFound(this.removeFromStore("things", { "UID": "demo1" }));
    await ignoreNotFound(this.removeFromStore("thing-types", { "UID": "demo1" }));
    await ignoreNotFound(this.removeFromStore("rules", { "uid": "demo1" }));
    await ignoreNotFound(this.removeFromStore("rules", { "uid": "demo2" }));
    await ignoreNotFound(this.removeFromStore("items", { "name": "demo1" }));
    await ignoreNotFound(this.removeFromStore("items", { "name": "demo2" }));
    delete this.lastRefresh[tableIDtoEntry["bindings"].uri];
    delete this.lastRefresh[tableIDtoEntry["inbox"].uri];
    delete this.lastRefresh[tableIDtoEntry["discovery"].uri];
    delete this.lastRefresh[tableIDtoEntry["things"].uri];
    delete this.lastRefresh[tableIDtoEntry["rules"].uri];
    delete this.lastRefresh[tableIDtoEntry["items"].uri];
    delete this.lastRefresh[tableIDtoEntry["thing-types"].uri];
  }

  sseMessageReceived(e) {
    const data = JSON.parse(e.data);
    if (!data || !data.payload || !data.type || !data.topic) {
      console.warn("SSE has unknown format", data.type, data.topic, data.payload);
      return;
    }
    const topic = data.topic.split("/");
    const storename = topic[1];
    let newState;
    console.debug("SSE", data);
    switch (data.type) {
      // -- Added --
      case "ItemAddedEvent":
      case "RuleAddedEvent":
      case "InboxAddedEvent":
      case "ThingAddedEvent":
        newState = JSON.parse(data.payload);
        this.insertIntoStore(storename, newState);
        return;
      // -- Updated --
      case "InboxUpdatedEvent":
        newState = JSON.parse(data.payload);
        this.insertIntoStore(storename, newState);
        return;
      case "ItemUpdatedEvent":
      case "RuleUpdatedEvent":
      case "ThingUpdatedEvent":
        newState = JSON.parse(data.payload)[0];
        this.insertIntoStore(storename, newState);
        return;
      // -- Removed --
      case "ItemRemovedEvent":
      case "RuleRemovedEvent":
      case "InboxRemovedEvent":
      case "ThingRemovedEvent":
        this.removeFromStore(storename, JSON.parse(data.payload));
        return;
      // -- State info changed --
      case "ItemStateEvent":
        newState = JSON.parse(data.payload);
        this.changeItemState(storename, topic[2], newState.value, "state");
        return;
      case "RuleStatusInfoEvent":
        newState = JSON.parse(data.payload);
        this.changeItemState(storename, topic[2], newState, "status");
        return;
      case "ThingStatusInfoEvent":
        newState = JSON.parse(data.payload);
        this.changeItemState(storename, topic[2], newState, "statusInfo");
        return;
      // -- Ignored events
      case "ThingStatusInfoChangedEvent":
      case "ItemStateChangedEvent":
      case "ItemStatePredicatedEvent":
      case "ItemCommandEvent":
        return;
    }
    console.warn("Unhandled SSE", data);
  }

  sseMessageError(e) {
    // The server-send-event part of openHAB is crap unfortunately and we will receive a lot
    // of disconnections. For OH3 websockets would be awesome, I guess.
    //console.log("sse error", e);
  }

  async connectToDatabase(hostname) {
    if (this.db) {
      this.db.close();
      delete this.db;
    }

    let hasPerformedUpdate = false;
    this.db = await openDb(hostname, dbversion, db => {
      console.log("Upgrading database to version", dbversion);
      hasPerformedUpdate = true;
      const objs = db.objectStoreNames;
      for (let ojs of objs) {
        db.deleteObjectStore(ojs);
      }
      for (let table of tables) {
        if (table.key) db.createObjectStore(table.id, { keyPath: table.key });
        else db.createObjectStore(table.id, { autoIncrement: true });
      }
    }).then(async db => {
      if (hasPerformedUpdate) await hack_addNotYetSupportedStoreData(db);
      return db;
    });
    return this.db;
  }

  /**
   * Returns true if a http request for a specific store should be blocked.
   * Useful for stores that have no direct REST endpoints like design study
   * invented ones.
   * 
   * This method always returns true if `host` is "demo".
   * 
   * @param {String} storename The store name
   */
  blockRESTrequest(storename, objectid = null) {
    if (this.host == "demo") return true;
    if (blockLiveDataFromTables.includes(storename)) return true;
    const tableRows = blockLiveDataFromTableRows[storename];
    if (tableRows && tableRows[objectid]) return true;
    return false;
  }

  performRESTandNotify(uri, disconnectIfFail = true) {
    const alreadyRunning = this.activeRESTrequests[uri];
    if (alreadyRunning) return alreadyRunning;
    return this.activeRESTrequests[uri] = fetchWithTimeout(this.host + "/" + uri)
      .then(response => {
        console.debug("Got new value", this.host + "/" + uri);
        if (!this.connected) {
          this.dispatchEvent(new CustomEvent("connectionEstablished", { detail: this.host }));
          this.connected = true;
        }
        delete this.activeRESTrequests[uri];
        this.lastRefresh[uri] = Date.now();
        return response;
      })
      .then(response => response.json())
      .catch(e => {
        if (!(e instanceof FetchError) && !disconnectIfFail && this.connected) {
          this.connected = false;
          const message = e.toString();
          let type = 404;
          if (message.includes("TypeError") && !message.includes("Failed to fetch")) {
            type = 4041; // custom error code for Cross-orgin access
          }
          console.warn("REST access failed", uri, e);
          this.dispatchEvent(new CustomEvent("connectionLost", { detail: { type, message } }));
        }
        throw e;
      });
  }

  cacheStillValid(uri) {
    const d = this.lastRefresh[uri];
    if (d === "block") {
      console.log("Tutorial blocked updates", uri);
      return true;
    }
    const r = (!!d && (d + this.expireDurationMS > Date.now()));
    if (r) console.log("Cache only response for", uri);
    return r;
  }

  async initialStoreFill(storename, jsonList, requireRewrite) {
    const tx = this.db.transaction(storename, 'readwrite');
    const store = tx.objectStore(storename);
    try {
      await store.clear();
    } catch (e) {
      console.warn("Failed to clear", storename);
      throw e;
    }
    for (let entry of jsonList) {
      if (requireRewrite) entry = hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry);
      try {
        await store.add(entry);
      } catch (e) {
        console.warn("Failed to add to", storename, entry);
        throw e;
      }
    }
    await tx.complete.catch(e => {
      console.warn("Failed to initialStoreFill", storename);
      throw e;
    });
  }

  async replaceStore(storename, jsonList) {
    jsonList = await hack_rewriteTableToNotYetSupportedStoreLayout(storename, jsonList, this);
    try {
      const tx = this.db.transaction(storename, 'readwrite');
      const store = tx.objectStore(storename);
      const key_id = tableIDtoEntry[storename].key;
      const oldData = await store.getAll();
      const compare = oldData.length == jsonList.length ? new CompareTwoDataSets(key_id, oldData) : { ok: false };
      // Clear and add entry per entry
      await store.clear();
      for (let entry of jsonList) {
        await store.add(hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry));
        if (compare.ok) compare.compareNewAndOld(entry, storename);
      }
      if (compare.ok) {
        if (compare.listOfUnequal.length == 0) console.debug("No data changed");
        for (let value of compare.listOfUnequal) {
          this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { value, storename } }));
        }
      }

      // Refetch the data set to have the list in the same order as before for making it easier for
      // Vue to match existing DOM nodes. Maybe it doesn't matter.. Has to be decided.
      let value = await this.db.transaction(storename, 'readonly').objectStore(storename).getAll();
      if (!compare.ok) {
        this.dispatchEvent(new CustomEvent("storeChanged", { detail: { storename } }));
      }
      return value;
    } catch (e) {
      console.warn("Failed to replaceStore", storename);
      throw e;
    }  }

  async removeFromStore(storename, jsonEntry) {
    if (!jsonEntry || typeof jsonEntry !== 'object' || jsonEntry.constructor !== Object) {
      console.warn("insertIntoStore must be called with an object", jsonEntry);
      return;
    }
    const tx = this.db.transaction(storename, 'readwrite');
    const store = tx.objectStore(storename);
    const id_key = tableIDtoEntry[storename].key;
    const id = jsonEntry[id_key];
    store.delete(id);

    await tx.complete.catch(e => {
      if (e instanceof DOMException && e.name === "NotFoundError") ; else throw (e);
    });
    this.dispatchEvent(new CustomEvent("storeItemRemoved", { detail: { "value": jsonEntry, "storename": storename } }));
    return null;
  }

  async changeItemState(storename, itemid, value, fieldname) {
    try {
      const tx = this.db.transaction(storename, 'readwrite');
      const store = tx.objectStore(storename);
      let item = await store.get(itemid);
      if (!item) {
        console.info("changeItemState: Item does not exist", itemid);
        return;
      }
      item[fieldname] = value;
      await store.put(item);
      this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { "value": item, "storename": storename } }));
    } catch (e) {
      console.warn("Failed to changeItemState", storename);
      throw e;
    }  }

  async insertIntoStore(storename, jsonEntry) {
    if (!jsonEntry || typeof jsonEntry !== 'object' || jsonEntry.constructor !== Object) {
      console.warn("insertIntoStore must be called with an object", storename, jsonEntry);
      return;
    }
    jsonEntry = hack_rewriteEntryToNotYetSupportedStoreLayout(storename, jsonEntry);
    try {
      const tx = this.db.transaction(storename, 'readwrite');
      const store = tx.objectStore(storename);
      const id_key = tableIDtoEntry[storename].key;
      const old = await store.get(jsonEntry[id_key]);
      await store.put(jsonEntry);
      if (!old) {
        this.dispatchEvent(new CustomEvent("storeItemAdded", { detail: { "value": jsonEntry, "storename": storename } }));
      } else if (JSON.stringify(old) != JSON.stringify(jsonEntry)) {
        this.dispatchEvent(new CustomEvent("storeItemChanged", { detail: { "value": jsonEntry, "storename": storename } }));
      }
      return jsonEntry;
    } catch (e) {
      console.warn("Failed to insertIntoStore", storename);
      throw e;
    }  }
}

function wrapIfRequired(tableLayout, objectid, json) {
  if (tableLayout.wrapkey) {
    let r = { id: objectid };
    r[tableLayout.wrapkey] = json;
    console.log("wrapIfRequired", json, r);
    return r;
  }
  return json;
}

function unwrapIfRequired(tableLayout, json) {
  if (json && tableLayout.wrapkey && json.id) {
    return json[tableLayout.wrapkey];
  }
  return json;
}

function extractFromArray(storename, objectid, json) {
  if (!Array.isArray(json)) return json;

  const id_key = tableIDtoEntry[storename].key;
  if (!id_key) {
    console.warn("No ID known for", storename);
    throw new Error("No ID known for " + storename);
  }

  for (let item of json) {
    if (item[id_key] == objectid) {
      return item;
    }
  }
  console.warn("Returned value is an array. Couldn't extract single value", json, uri, objectid, id_key);
  throw new Error("Returned value is an array. Couldn't extract single value");
}

function ignoreNotFound(promise) {
  return promise.catch(e => {
    if (e instanceof DOMException && e.name === "NotFoundError") return; throw (e);
  });
}

/**
 * Process a collection of items and returns the processed collection.
 * 
 * @param {Object[]} data The collection of items to sort / filter / limit
 * @param {Object} options Options for sorting, filtering, limiting
 * @param {Number} options.limit Optional: Limit for the resulting collection. Is applied after sorting of course.
 * @param {String} options.sort Optional: Sort criteria (aka collection item property).
 * @param {String} options.filter Optional: A filter query like "label:living room" or "tags:abc && label:def"
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
function process(data, options) {
  const limit = options.limit;
  const hasmore = limit && limit < data.length;
  const filterString = options.filter && options.filter.length ? options.filter : null;
  const sortCriteria = options.sort;

  // No filter, no sort?
  if (!(filterString) && !sortCriteria) {
    // But limit?
    if (hasmore) {
      const copy = data.slice(0, limit);
      copy.hasmore = true;
      return copy;
    }

    return data;
  }

  // Tokenize the filter string
  // Array of filter condition tupels [c,f] with c:criteria,f:filterQuery
  let filters = [];
  if (filterString) {
    const queryParts = filterString.split("&&");
    for (let queryPart of queryParts) {
      const criteriaAndQuery = queryPart.split(/:(.+)/);
      if (criteriaAndQuery.length >= 2) {
        filters.push({ c: criteriaAndQuery[0], f: criteriaAndQuery[1].trim().toLowerCase() });
      } else {
        console.warn("Filter query must be criteria:filterQuery");
      }
    }
  }

  // First filter if necessary
  let c = 0;
  const reverse = options.direction == "↓"; // ↓ or ↑
  const filtered = [];
  // Filter list. The criteria item property can be an array in which case we check
  // if the filter string is within the array. Do not limit here if we are sorting.
  for (let item of data) {
    if (!applyFilter(filters, item)) continue;

    if (sortCriteria && item[sortCriteria])
      insertInto(filtered, item, sortCriteria, reverse);
    else { // No sorting but limit? Return now
      c += 1;
      filtered.push(item);
      if (limit && c >= limit) {
        filtered.hasmore = true;
        return filtered;
      }
    }
  }

  // Apply limit after sorting
  if (limit && limit < data.length) {
    filtered.splice(limit);
    filtered.hasmore = true;
  }
  return filtered;
}

/**
 * Returns true if item1 is greater than item2
 * 
 * @param {Object} item1 Item to compare
 * @param {Object} item2 Item to compare
 * @param {String} sortCriteria A property name that must exist on both items
 * 
 * @memberof module:storage-webworker
 * @category Webworker Storage Model
 */
function isGreater(item1, item2, sortCriteria) {
  return item1[sortCriteria] > item2[sortCriteria];
}

/**
 * Inserts a new item into a collection by using insertion sort with
 * a binary search on bigger collections and small collection size
 * manually handling otherwise.
 * 
 * This sort is not stable, because we use `isGreater` which can't
 * make an assertment about item equality.
 *
 * @param {Object[]} collection A sorted collection
 * @param {Object} newItem The new item to be inserted into the sorted collection
 * @param {String} sortCriteria The sort criteria
 * @param {Boolean} reverse Reverses the sort
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
function insertInto(collection, newItem, sortCriteria, reverse) {
  // Handle small sizes manually
  switch (collection.length) {
    case 0: // First item: Just add
      collection.push(newItem);
      return;
    case 1: // Two items: One comparison
      if (isGreater(collection[0], newItem, sortCriteria)) {
        collection.unshift(newItem);
      } else {
        collection.push(newItem);
      }
      return;
    case 2: // linear insertion sort
    case 3:
    case 4:
    case 5:
      for (let c = 0; c < collection.length; ++c) {
        if (isGreater(collection[c], newItem, sortCriteria)) {
          collection.splice(c, 0, newItem);
          return;
        }
      }
      collection.push(newItem);
      return;
  }

  let left = 0;
  let right = collection.length;
  let middle = Math.floor((left + right) / 2);
  while (left <= right) {
    if (isGreater(newItem, collection[middle], sortCriteria)) {
      left = middle + 1;
    } else if (isGreater(collection[middle], newItem, sortCriteria)) {
      right = middle - 1;
    } else {
      break;
    }
    middle = Math.floor((right + left) / 2);
  }
  collection.splice(left, 0, newItem);
}

/**
 * Returns true if the filter pattern matches with the item.
 * @param {Object[]} filters The filter arguments
 * @param {String} filters[].c The property name (for instance "id","label")
 * @param {String} filters[].f The filter term (for instance ("living room"))
 * @param {*} item The item
 * 
 * @category Webworker Storage Model
 * @memberof module:storage-webworker
 */
function applyFilter(filters, item) {
  for (let filter of filters) {
    let value = item[filter.c];
    if (!value) return false;
    if (Array.isArray(value)) {
      if (!value.some(element => element.toLowerCase().match(filter.f)))
        return false;
    } else if (value instanceof Object) {
      if (!Object.keys(value).some(key => value[key].toLowerCase().match(filter.f)))
        return false;
    } else if (!value.toLowerCase().match(filter.f)) {
      return false;
    }
  }
  return true;
}

const store = new StateWhileRevalidateStore;

/**
 * This is meant to be used as a web-worker or as a shared-web-worker.
 * In this main entry point file the web-worker message channel is established
 * and incoming messages are proxied to the store and store responses
 * as well as events are marshalled into outgoing messages.
 * 
 * @category Webworker Storage Model
 */
class StorageWorker {
  constructor() {
    store.addEventListener("dump", (e) => this.postMessage({ type: "dump", msg: e.detail }));
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
      console.warn("Database error", e.type, error);
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

/**
 * The data model module
 * 
 * @category Webworker Storage Model
 * @module storage-webworker
 */
