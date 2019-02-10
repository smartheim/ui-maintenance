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
export class CompareTwoDataSets {
    /**
    * @param {String} key_id The key name for this store (e.g. "id","uid" etc)
    * @param {String} storename The storename for debugging messages
    * @param {Object} oldData The old data
    * @param {Object} newData The new data
    */
    constructor(key_id, storename, oldData, newData) {
        this.key_id = key_id;
        this.storename = storename;
        this.ok = oldData.length == newData.length;
        if (!this.ok) {
            return;
        }

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
     */
    compareNewAndOld(entry) {
        if (!this.ok) return;

        const newHash = hashCode(entry);
        const id = entry[this.key_id];
        const oldHash = this.indexedData[id];
        if (newHash != oldHash) {
            console.debug("replaceStore !entry", this.storename, id, newHash, oldHash);
            this.listOfUnequal.push(entry);
            if (this.listOfUnequal.length > EQ_TRESHOLD) this.ok = false;
        }
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
};

export function hashCode(obj) {
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
