
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
 */
function insertInto(collection, newItem, sortCriteria, reverse) {
    // Handle small sizes manually
    switch (collection.length) {
        case 0: // Just add
            collection.push(newItem);
            return;
        case 1: // One comparison
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

    var left = 0;
    var right = collection.length;
    var middle = Math.floor((left + right) / 2);
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

export function process(data, options) {
    const limit = options.limit;
    const hasmore = limit && limit < data.length;
    const filterString = options.filter && options.filter.length ? options.filter : null;
    const sortCriteria = options.sort;

    // No filter, no sort?
    if (!(filterString) && !sortCriteria) {
        // But limit?
        if (hasmore) {
            data.splice(limit);
            data.hasmore = true;
        }
        return data;
    }

    // Tokenize the filter string
    // Array of filter condition tupels [c,f] with c:criteria,f:filterQuery
    let filters = [];
    if (filterString) {
        var queryParts = filterString.split("&&");
        for (let queryPart of queryParts) {
            var criteriaAndQuery = queryPart.split(":");
            if (criteriaAndQuery.length == 2) {
                filters.push({ c: criteriaAndQuery[0], f: criteriaAndQuery[1].trim().toLowerCase() });
            } else {
                console.warn("Filter query must be criteria:filterQuery");
            }
        }
    }

    // First filter if necessary
    var c = 0;
    const reverse = options.direction == "↓"; // ↓ or ↑
    var filtered = [];
    // Filter list. The criteria item property can be an array in which case we check
    // if the filter string is within the array. Do not limit here if we are sorting.
    for (var item of data) {
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
