<template>
  <div class="element" :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
      <button
        v-if="allowremove && param.defaultValue && value"
        title="Reset to default"
        class="mr-2 btn resetdefault"
        @click.prevent="$emit('remove')"
      >
        <i class="fas fa-undo"></i>
      </button>
      <vue-config-element :condensed="condensed" :param="param" :value="get()" @input="set($event)"></vue-config-element>
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
  </div>
</template>

<script>
export default {
  props: ["param", "allowremove", "condensed"],
  data: () => {
    return {
      value: ""
    };
  },
  methods: {
    get() {
      return this.value || this.param.defaultValue;
    },
    set(event) {
      this.$emit("input", event.target.value);
    }
  }
};
</script>