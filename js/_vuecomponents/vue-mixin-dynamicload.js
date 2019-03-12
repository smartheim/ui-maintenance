import { store } from '../js/app.js'; // Pre-bundled, external reference

/**
 * A vue mixin, that allows a dropdown or multiselect element
 * (or any dom element that takes an "options" property) to be populated
 * with OH Model data. The data is fetched on-demand from the Model Store
 * as soon as the element has been rendered by vue.
 * 
 * This is realized by the following vue directive called "v-dynamicload",
 * which as soon as the element binding happens, calls "performLoad".
 * 
 * The data is fetched once and not updated if the underlying model changes.
 * The data is cached, as long the the parent root vue is existing.
 * 
 * If you want the data to be refreshed when another vue element changed, you can
 * use a reactive variable instead of a static filter object as value.
 *
 * @example Example for a dropdown box that shows all available bindings, using the model table "bindings".
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="" ></ui-dropdown>
 * 
 * @example You can filter items of a table by using the directives value.
 * The value is an array of filter objects with a "name" and a regex "value".
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="[{ name: 'id', value: '^mqtt:' }]" ></ui-dropdown>
 * 
 * @example Use a reactive variable "bindingids". The directive will be executed again
 * when the variable changes.
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="bindingids" ></ui-dropdown>
 */
const DynamicLoadMixin = {
  directives: {
    dynamicload: {
      bind: (el, binding) => performLoad(el, binding),
      // Avoid to re-populate the dropdown/multiselect with same values by diffing old and old new filter array
      update: (el, binding) => {
        const newIsArray = Array.isArray(binding.value);
        const oldIsArray = Array.isArray(binding.oldValue);
        if (!newIsArray && !oldIsArray) return; // Both no valid values: exit
        if (newIsArray != oldIsArray) { // One is an array the other not: Perform an option recomputation
          performLoad(el, binding);
          return;
        }

        // Compute a string out of the filters and compare to saved filters string
        const filterString = binding.value.reduce((acc, filter) => acc += filter.name + filter.value, "");
        if (el.dataset.dynload_filterString != filterString) {
          performLoad(el, binding);
        }
      }
    }
  },
}

export { DynamicLoadMixin };

/**
 * This is the cache for all "v-dynamicload"s of one root vue instance.
 * There is no way to force a cache refresh, so use this mixin only for
 * static cases like selecting an Item for a Rule action or similar.
 */
const dynamicallyFetchedSharedData = {};

/**
 * Load a table from the backend store (like "rules","things" and so on)
 * and assign the asynchronously gathered data to the target dom element.
 * The target element is assumed to be a dropdown or multiselect element.
 * 
 * @param {Element} el A dom element
 * @param {Object} binding A vue directive binding object
 */
async function performLoad(el, binding) {
  el.dynamicLoadBind = binding;
  // The user wants the element to be deliberately empty
  if (binding.value === null) {
    el.options = [];
    return;
  }

  // First try to get a cached value
  let tabledata = dynamicallyFetchedSharedData[binding.arg];
  if (!tabledata) {
    const ischannel = binding.arg == "channels";
    if (!store.connected) {
      console.warn(`Dynamic load of ${binding.arg} failed. Not connected`);
      return;
    }
    // A lot of dom elements can ask for the same dynamically loaded data. We therefore store
    // the fetch promise in the cache object. Any consecutive load requests will receive the promise
    // (as long as the fetch is not resolved) instead of performing a parallel second, third.. fetch.
    const fetchPromise = store.get(ischannel ? "things" : binding.arg, null, { force: true });
    dynamicallyFetchedSharedData[binding.arg] = fetchPromise
    tabledata = await fetchPromise.catch(e => console.warn(`Dynamic load of ${binding.arg} failed`, e));
    if (!tabledata) return;
    if (ischannel) {
      let channels = [];
      for (let thing of tabledata) {
        channels = channels.concat(thing.channels);
      }
      tabledata = channels;
    }
    // Assign value to the cache 
    dynamicallyFetchedSharedData[binding.arg] = tabledata;
  }

  // If cached data is a promise, resolve it now
  if (tabledata.then) tabledata = await tabledata;

  // Apply filters. This is for example used to filter "channels" by their "kind" (STATE, TRIGGER).
  // A filter looks like this: {"value": "TRIGGER","name": "kind"}
  let filters = Array.isArray(binding.value) ? binding.value : [];
  let filterString = "";
  for (let filter of filters) {
    const regex = new RegExp(filter.value);
    tabledata = tabledata.filter(item => item[filter.name].match(regex));
    filterString += filter.name + filter.value;
  }

  // Assign value to the target dom
  el.options = tabledata;
  el.dataset.dynload_filterString = filterString;
}
