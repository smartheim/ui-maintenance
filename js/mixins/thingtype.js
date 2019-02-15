import { store, fetchMethodWithTimeout } from '../app.js';
import { generateThingTemplate, Yaml } from '../ohcomponents.js';

const Mixin = {
    mounted: function () {
    },
    data: function () {
        return {
        }
    },
    computed: {

    },
    methods: {
        getDemoYaml() {
            let json = generateThingTemplate(this.context.schema,
                this.context.thingType, this.context.channelConfigTypes, this.context.channelTypes,
                this.context.focus, this.context.focusChannelindex, true);

            return Yaml.dump(json, 10, 4).replace(/-     /g, "-\n    ");
        }
    }
}

export const mixins = [Mixin];
