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
export default async function (store, options, objectid) {
  if (!options || !options.thingUID) throw new Error("No thingUID set!");
  const thing = await store.get("things", options.thingUID, options);
  const channels = thing.channels;
  channels.thing = thing; // Attach the original thing object to the array
  if (objectid) {
    return channels.find(i => i.uid == objectid);
  } else
    return channels;
}