// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import * as cronstrue from './cronstrue.js';

const demoItems = [
    {
        "editable": true,
        "label": "My wakeup timer",
        "tags": ["Lighting"],
        "totalRuns": 5,
        "remainingRuns": null,
        "cronExpression": "0 7 ? * MON-FRI",
        "type":"cron",
        "enabled": true,
        "UID": "timer:3edb5737",
        "lastrun": 1546950225013,
    },
    {
        "editable": true,
        "label": "Garden watering",
        "tags": ["Lighting"],
        "totalRuns": 17,
        "remainingRuns": null,
        "cronExpression": "0 30 10-13 ? * WED,FRI",
        "type":"cron",
        "enabled": true,
        "UID": "timer:4263ds53",
        "lastrun": 1546950225013,
    },
    {
        "editable": true,
        "label": "An absolut timer",
        "tags": ["Lighting"],
        "totalRuns": 0,
        "remainingRuns": 1,
        "datetime": "2008-09-15T15:53:00",
        "type":"fixed",
        "enabled": true,
        "UID": "timer:4263ds53",
        "lastrun": 1546950225013,
    },
];


const schema = {
    uri: 'http://openhab.org/schema/timer-schema.json',
    fileMatch: ["http://openhab.org/schema/timer-schema.json"],
    schema: {
        type: 'array',
        items: { "$ref": "#/definitions/item" },
        definitions: {
            item: {
                type: "object",
                description: "An openHAB thing",
                required: ["UID", "type", "label"],
                properties: {
                    link: { type: "string", description: "Internal URI information for openHAB REST clients" },
                    editable: { type: "boolean", description: "Items defined via old .item files are not editable" },
                    UID: { type: "string", description: "A unique ID for this thing", minLength: 2 },
                    label: { type: "string", description: "A friendly name", minLength: 2 },
                    tags: { type: "array", "uniqueItems": true, description: "Tags of this item" },
                    type: {
                        enum: ['fixed', 'cron'],
                        description: "A fixed timer runs once at the given date and time. A cron timer is reoccuring."
                    },
                    cronExpression: { type: "string", description: "A cron expression for reoccuring events", minLength: 2  },
                    datetime: { type: "string", description: "A date/time expressed as ISO 8601 Notation", minLength: 2  }
                    // config: { // reference the second schema.. demo
                    //     $ref: 'http://myserver/bar-schema.json', 
                    // },
                }
            }
        }
    },
}

const TimerMixin = {
    methods: {
        timerStatusinfo: function (item) {
            return (item.lastrun + 5000) > Date.now() ? "Running" : "Idle";
        },
        timerStatusBadge: function (item) {
            return (item.lastrun + 5000) > Date.now() ? "badge badge-success" : "badge badge-light";
        },
        timerDescription: function (item) {
            if (item.type == "cron") {
                try {
                    return cronstrue.toString(item.cronExpression, { throwExceptionOnParseError: true, use24HourTimeFormat: true });
                } catch (e) {
                    return "Cron expression parse error: "+e;
                }
            } else if (item.type == "fixed") {
                return new Date().toString();
            } else {
                return "Unsupported timer type";
            }
        }
    }
}

window.loadTimers = function (vueList) {
    calledOnce = true;
    vueList.start([TimerMixin], 'http://openhab.org/schema/timer-schema.json', schema, ["link","editable","remainingRuns","totalRuns","lastrun"]);
    vueList.items = demoItems;
};

var calledOnce = false;
var el = document.getElementById("timersapp");
if (el && !calledOnce) loadTimers(el);