import { fetchWithTimeout } from '../_common/fetch';

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
export function hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry) {
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
        ]
      }
      else if (entry.id == "mqtt") {
        entry.custompages = [
          {
            "uri": "dummydata/mqtt.html",
            "label": "MQTT Traffic monitor"
          }
        ]
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
          entry.description = "The Link will also pass Item state updates to the connected Channel. You usually want that to synchronize two or more different Binding Channels.";
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
      }
      entry.repository = "oh2addons"
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
      }
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
export async function hack_rewriteTableToNotYetSupportedStoreLayout(storename, table, store) {
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
export const blockLiveDataFromTableRows = {
  "inbox": { "demo1": true, "demo2": true },
  "things": { "demo1": true, "demo2": true },
  "rules": { "demo1": true, "demo2": true },
  "items": { "demo1": true, "demo2": true },
  "bindings": { "demo1": true, "demo2": true },
  "services": { "org.openhab.backup": true, "org.openhab.longtimestability": true, "org.openhab.logging": true },
  "service-config": { "org.openhab.backup": true, "org.openhab.longtimestability": true, "org.openhab.logging": true },
};
