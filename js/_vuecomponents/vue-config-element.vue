<template>
  <ui-switch
    v-if="param.type=='BOOLEAN'"
    :label="param.name"
    :value.prop="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  ></ui-switch>

  <input
    v-else-if="param.type=='DECIMAL' || param.type=='INTEGER'"
    type="number"
    :min="param.min"
    :max="param.max"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  >
  
  <input
    v-else-if="param.type=='TEXT' && ['time','tel','email','url','password'].includes(param.context)"
    :type="param.context"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  >

  <ui-tags
    v-else-if="param.context=='tags'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  ></ui-tags>

  <ui-dropdown
    v-else-if="param.type=='TEXT' && param.limitToOptions===true && param.options && param.options.length>0"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    placeholder="Please select"
    :options.prop="param.options"
    valuekey="value"
    viewkey="label"
  ></ui-dropdown>

  <ui-multiselect
    v-else-if="param.type=='TEXT' && param.limitToOptions===true && param.options && param.options.length>0 && param.multiple"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    :options.prop="param.options"
    placeholder="Please select"
    valuekey="value"
    viewkey="label"
  ></ui-multiselect>

  <a
    v-else-if="param.context=='script'"
    href="#editor"
    @click="this.$emit('showeditor')"
    :title="'Default value: '+param.defaultValue"
    class="btn btn-primary-hover"
  >Edit script</a>

  <ui-time-picker
    v-else-if="param.context=='date'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  ></ui-time-picker>

  <ui-time-picker
    v-else-if="param.context=='datetime'"
    enable-time="true"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  ></ui-time-picker>

  <ui-multiselect
    v-else-if="param.context=='rule' && param.multiple"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="uid"
    viewkey="name"
    v-dynamicload:rules="param.filterCriteria"
  ></ui-multiselect>

  <ui-dropdown
    v-else-if="param.context=='rule'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="uid"
    viewkey="name"
    v-dynamicload:rules="param.filterCriteria"
  ></ui-dropdown>

  <ui-multiselect
    v-else-if="param.context=='channel' && param.multiple"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="uid"
    viewkey="label"
    v-dynamicload:channels="param.filterCriteria"
  ></ui-multiselect>

  <ui-dropdown
    v-else-if="param.context=='channel'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="uid"
    viewkey="label"
    v-dynamicload:channels="param.filterCriteria"
  ></ui-dropdown>

  <ui-multiselect
    v-else-if="param.context=='item' && param.multiple"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="name"
    viewkey="label"
    v-dynamicload:items="param.filterCriteria"
  ></ui-multiselect>

  <ui-dropdown
    v-else-if="param.context=='item'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
    valuekey="name"
    desckey="name"
    viewkey="label"
    v-dynamicload:items="param.filterCriteria"
  ></ui-dropdown>

  <ui-cron-expression
    v-else-if="param.context=='cronexpression'"
    :value="get()"
    @input="set"
    :title="'Default value: '+param.defaultValue"
  ></ui-cron-expression>

  <div v-else-if="param.context=='location'" :title="'Default value: '+param.defaultValue">
    <input :value="get()" @input="set" ref="mapcoordinates">
    <ui-maps @change="mapChanged"></ui-maps>
  </div>

  <input v-else :title="'Default value: '+param.defaultValue" :value="get()" @input="set">
</template>

<script>
import { DynamicLoadMixin } from "./vue-mixin-dynamicload";

export default {
  // If condensed is true: Render an "edit" button instead of inlining the component.
  // Useful for multi-line inputs and map widgets.
  props: ["param", "value", "condensed"],
  computed: {
    canremove() {
      this.allowremove && this.param.defaultValue;
    }
  },
  mixins: [DynamicLoadMixin],
  methods: {
    get() {
      return this.value || this.param.defaultValue;
    },
    set(event) {
      this.$emit("input", event.target.value);
    },
    mapChanged(event) {
      this.$refs.mapcoordinates.value =
        event.target.value[0] + "," + event.target.value[1];
    }
  }
};
</script>