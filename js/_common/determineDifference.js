import { CompareTwoDataSets } from './compareTwoDatasets';

/**
 * Computes the difference between `after` and `before` arrays of objects.
 * The objects are expected to have a property with the name of `idkey`.
 * 
 * This method returns an object with 3 arrays: created, updated, removed.
 */
export function determineDifference(after, before, idkey) {
  let created = [];
  let updated = [];
  let updatedOldEntry = [];
  let removed = [];
  let beforeMap = new Map();
  for (let beforeItem of before) beforeMap.set(beforeItem[idkey], beforeItem);
  let foundSet = new Set();

  for (let afterItem of after) {
    const afterID = afterItem[idkey];
    const oldItem = beforeMap.get(afterID);
    if (oldItem) {
      if (foundSet.has(afterID)) throw new Error(`Two objects with same ${idkey} detected: ${afterID}`);
      foundSet.add(afterItem[idkey]);
      updated.push(afterItem);
      updatedOldEntry.push(oldItem);
    } else {
      created.push(afterItem);
    }
  }

  // Determine removed ones
  for (let beforeItem of before) {
    if (!foundSet.has(beforeItem[idkey])) {
      removed.push(beforeItem);
    }
  }

  // Determine if "updated" array objects really have changed
  const compare = new CompareTwoDataSets(idkey, updatedOldEntry);
  updated = updated.filter(u => !compare.compareNewAndOld(u));

  return { created, updated, removed };
} 