import Yaml from '../yaml/yaml';

function generateTree(target, key, value, configurationType) {
    if (value.type == 'boolean') {
        target[key] = false;
    } else if (value.type == 'string') {
        if (value.enum && value.enum.length) {
            target[key] = value.enum[0];
        } else
            target[key] = value.description
    } else if (value.type == 'array' && value.items && value.items.type == 'string') {
        target[key] = ["Demo1", "Demo2"];
    } else if (key == 'configuration' && configurationType) {
        let configs = {};
        for (let configParameter of configurationType) {
            configs[configParameter.name] = configParameter.defaultValue ? configParameter.defaultValue : configParameter.label;
        }
        target[key] = configs;
    }
}

function generateTreeRoot(schema, thingType, channelConfigTypes, channelTypes, listAllChannels = false) {
    let target = {};
    const schemaKeys = Object.keys(schema);
    for (let key of schemaKeys) {
        let value = schema[key];
        if (key == 'channels' && thingType && thingType.channels) {
            let channels = [];
            const channelKeys = Object.keys(schema.channels.items.properties);
            for (let extendedChannelType of channelTypes) {
                if (!listAllChannels && !thingType.channels.find(c => c.typeUID == extendedChannelType.UID)) continue;
                let channelTarget = {};
                for (let channelKey of channelKeys) {
                    let channelValue = schema.channels.items.properties[channelKey];
                    switch (channelKey) {
                        case "uid":
                            channelTarget[channelKey] = thingType.UID + ":myThingID:" + extendedChannelType.id;
                            break;
                        case "id":
                            channelTarget[channelKey] = extendedChannelType.id;
                            break;
                        case "channelTypeUID":
                            channelTarget[channelKey] = extendedChannelType.UID;
                            break;
                        case "label":
                            channelTarget[channelKey] = extendedChannelType.label;
                            break;
                        case "defaultTags":
                            channelTarget[channelKey] = extendedChannelType.tags ? extendedChannelType.tags : [];
                            break;
                        case "kind":
                            channelTarget[channelKey] = extendedChannelType.kind;
                            break;
                        case "itemType":
                            channelTarget[channelKey] = extendedChannelType.itemType;
                            break;
                        default:
                            const channelConfigType = channelConfigTypes ? channelConfigTypes.find(c => c.uri == "channel-type:" + extendedChannelType.UID) : null;
                            generateTree(channelTarget, channelKey, channelValue, channelConfigType ? channelConfigType.parameters : null);
                    }
                }
                channels.push(channelTarget);
            }
            target[key] = channels;
        } else {
            generateTree(target, key, value, thingType ? thingType.configParameters : null);
        }
    }
    return target;
}

export function generateTemplateForSchema(schema, thingType, channelConfigTypes, channelTypes, focus, focusChannelindex, listAllChannels = false) {
    let demo = generateTreeRoot(schema, thingType, channelConfigTypes, channelTypes, listAllChannels);

    if (focus == "channels" && demo.channels)
        demo = demo.channels;
    else if (focus == "channelconfig" && demo.channels.length > focusChannelindex) {
        demo = demo.channels[focusChannelindex];
    }
    return demo;
}
