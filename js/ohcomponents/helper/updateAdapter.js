
/**
 * Takes a list adapter, the database store and optionally an objectid.
 * 
 * Whenever the store changes, the list adapter content will be updated,
 * which in turn will update the views.
 */
export class UpdateAdapter {
  constructor(modeladapter, store, objectid = null) {
    this.modeladapter = modeladapter;
    this.store = store;
    this.objectid = objectid;
    this.listChangedBound = (e) => this.listChanged(e.detail);
    this.listEntryChangedBound = (e) => this.listEntryChanged(e.detail);
    this.listEntryRemovedBound = (e) => this.listEntryRemoved(e.detail);
    this.listEntryAddedBound = (e) => this.listEntryAdded(e.detail);

    store.addEventListener("storeChanged", this.listChangedBound, false);
    store.addEventListener("storeItemChanged", this.listEntryChangedBound, false);
    store.addEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
    store.addEventListener("storeItemAdded", this.listEntryAddedBound, false);
  }
  dispose() {
    this.store.removeEventListener("storeChanged", this.listChangedBound, false);
    this.store.removeEventListener("storeItemChanged", this.listEntryChangedBound, false);
    this.store.removeEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
    this.store.removeEventListener("storeItemAdded", this.listEntryAddedBound, false);
  }

  /**
  * The entire list changed. Find the matching entry and update it.
  */
  listChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;
    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      value.splice(0, value.length, ...e.value);
      console.log("listChanged->update view", e.storename, value.length);
    } else {
      for (let entry of e.value) {
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] != this.objectid) continue;
        console.debug("listChanged->update view", e.storename, entry);
        setval(adapterField, this, entry);
        return;
      }
    }
  }

  listEntryChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      if (!id) {
        console.warn(`listEntryChanged: Expected key property "${this.modeladapter.STORE_ITEM_INDEX_PROP} for ${e.storename}`, e.value);
        return;
      }
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        let entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          value.splice(i, 1, e.value);
          console.warn(value);
          return;
        }
      }
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryChanged->update view", e.storename, e.value);
        setval(adapterField, this, e.value);
      }
    }
  }

  listEntryRemoved(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        const entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          console.debug("listEntryRemoved->update view", e.storename, e.value);
          value.splice(i, 1);
          return;
        }
      }
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryRemoved->update view", e.storename, e.value);
        setval(adapterField, this, {});
      }
    }
  }

  listEntryAdded(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;

    let value = val(adapterField, this);
    if (Array.isArray(value)) {
      const id = e.value[this.modeladapter.STORE_ITEM_INDEX_PROP];
      // Find entry in adapters list
      for (let i = 0; i < value.length; ++i) {
        const entry = value[i];
        if (entry[this.modeladapter.STORE_ITEM_INDEX_PROP] == id) {
          console.debug("listEntryChanged->update view", e.storename, e.value);
          value.splice(i, 1, e.value);
          return;
        }
      }
      // Not found in list -> add entry
      console.debug("listEntryChanged->add to view", e.storename, e.value);
      value.push(e.value);
    } else {
      if (this.objectid === "") return;
      if (e.value[this.modeladapter.STORE_ITEM_INDEX_PROP] == this.objectid) {
        console.debug("listEntryAdded->update view", e.storename, e.value);
        setval(adapterField, this, e.value);
      }
    }
  }
}

function val(adapterField, u) {
  return u.modeladapter[adapterField];
}

function setval(adapterField, u, newval) {
  u.modeladapter[adapterField] = newval;
}
