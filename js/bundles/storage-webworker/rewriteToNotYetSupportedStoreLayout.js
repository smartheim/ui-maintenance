/**
 * This file contains hacks!
 * It contains REST receive rewrite operations to support features that are not yet in
 * the mainline openHAB.
 */
import { fetchWithTimeout } from '../../common/fetch';

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

export function hack_rewriteEntryToNotYetSupportedStoreLayout(storename, entry) {
    switch (storename) {
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
                { id: "disable", label: "Disable", description: "Disable this thing" },
                { id: "pair", label: "Start pairing", description: "This thing requires a special pairing method" },
                { id: "unpair", label: "Unpair", description: "Removes the association to the remote device" },
            ];
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
        case "extensions": {
            entry.availableVersions = [
                "2.4 - Stable",
                "2.5 - Snapshot"
            ];
            entry.availableVersions.push(entry.version);
            entry.author = randomNames[Math.floor(Math.random() * 9)].name;
            entry.description = randomDesc[Math.floor(Math.random() * 9)].about;
            entry.status = entry.installed ? "installed" : "notinstalled";
            delete entry.installed;
            entry.repository = "oh2addons"
            if (entry.id.includes("binding")) {
                var id = entry.id.replace("-", ".");
                entry.url_doc = "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab." + id + "/README.md";
                entry.url_changelog = "https://raw.githubusercontent.com/openhab/openhab2-addons/master/addons/binding/org.openhab." + id + "/changelog.md";
            }
            break;
        }
        case "discovery": {
            const id = entry;
            entry = {
                id: id,
                background: id != "network" ? true : false,
                duration: 60,
                activeRemaining: id == "network" ? 40 : 0,
            }
            break;
        }
    }
    return entry;
}

export async function hack_rewriteTableToNotYetSupportedStoreLayout(storename, table, store) {
    if (store.openhabHost == "demo") {
        return table;
    }

    switch (storename) {
        /**
         * The module-types entries do not store their own type (what the heck??).
         * So we need to http GET all three endpoints, for each type one, and compare all
         * entries to those three sets. Tedious.
         */
        case "module-types": {
            let uris = [store.openhabHost + "/rest/module-types?type=action",
            store.openhabHost + "/rest/module-types?type=condition",
            store.openhabHost + "/rest/module-types?type=trigger"];
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