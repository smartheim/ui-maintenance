import { generateTemplateForSchema, Yaml } from '../uicomponents.js';

/**
 * This adapter is used in thing_type.fragment.html to show a yaml
 * template for a new Thing.
 */

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
      let json = generateTemplateForSchema(this.context.schema,
        this.context.thingType, this.context.channelConfigTypes, this.context.channelTypes,
        this.context.focus, this.context.focusChannelindex, true);

      return Yaml.dump(json, 10, 4).replace(/-     /g, "-\n    ");
    }
  }
};

const mixins = [Mixin];

export { mixins };
