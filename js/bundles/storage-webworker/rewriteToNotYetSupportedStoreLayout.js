export function hack_rewriteToNotYetSupportedStoreLayout(storename, entry) {
    switch (storename) {
        case "bindings": {
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
            }
            break;
        }
        case "extensions": {
            entry.availableVersions = [
                "2.4 - Stable",
                "2.5 - Snapshot"
            ];
            entry.status = entry.installed ? "installed" : "notinstalled";
            delete entry.installed;
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