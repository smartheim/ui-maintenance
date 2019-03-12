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
export { process };

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
