<template>
  <div class="element" :class="{isboolean:param.type=='BOOLEAN'}">
    <label v-if="param.type!='BOOLEAN'" :title="param.description">{{param.label}}</label>
    <button
      :disabled="!value"
      title="Reset to default"
      class="btn btn-outline-danger btn-sm resetdefault"
      @click.prevent="remove()"
    >
      <i class="fas fa-undo"></i>
    </button>

    <ui-switch
      v-if="param.type=='BOOLEAN'"
      :label="param.label||param.name"
      :value.prop="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      class="configcontrol"
    ></ui-switch>

    <input
      v-else-if="param.type=='DECIMAL' || param.type=='INTEGER'"
      class="form-control configcontrol"
      type="number"
      :min="param.min"
      :max="param.max"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
    >
    
    <input
      v-else-if="param.type=='TEXT' && ['time','tel','email','url','password'].includes(param.context)"
      class="form-control configcontrol"
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
      class="configcontrol"
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
      class="configcontrol"
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
      class="configcontrol"
    ></ui-multiselect>

    <a
      v-else-if="param.context=='script'"
      href="#editor"
      @click="this.$emit('showeditor')"
      :title="'Default value: '+param.defaultValue"
      class="btn btn-primary-hover configcontrol"
    >Edit script</a>
    
    <a
      v-else-if="param.context=='json'"
      href="#editor"
      @click="this.$emit('showeditor',{mimetype:'application/json'})"
      :title="'Default value: '+param.defaultValue"
      class="btn btn-primary-hover configcontrol"
    >Edit json</a>

    <ui-time-picker
      v-else-if="param.context=='date'"
      :value="get()"
      @input="set"
      class="configcontrol"
      :title="'Default value: '+param.defaultValue"
    ></ui-time-picker>

    <ui-time-picker
      v-else-if="param.context=='datetime'"
      enable-time="true"
      :value="get()"
      @input="set"
      class="configcontrol"
      :title="'Default value: '+param.defaultValue"
    ></ui-time-picker>

    <ui-multiselect
      v-else-if="param.context=='rule' && param.multiple"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      valuekey="uid"
      viewkey="name"
      class="configcontrol"
      v-dynamicload:rules="param.filterCriteria"
    ></ui-multiselect>

    <ui-dropdown
      v-else-if="param.context=='rule'"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      valuekey="uid"
      viewkey="name"
      class="configcontrol"
      v-dynamicload:rules="param.filterCriteria"
    ></ui-dropdown>

    <ui-multiselect
      v-else-if="param.context=='channel' && param.multiple"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      valuekey="uid"
      viewkey="label"
      class="configcontrol"
      v-dynamicload:channels="param.filterCriteria"
    ></ui-multiselect>

    <ui-dropdown
      v-else-if="param.context=='channel'"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      valuekey="uid"
      viewkey="label"
      class="configcontrol"
      v-dynamicload:channels="param.filterCriteria"
    ></ui-dropdown>

    <ui-multiselect
      v-else-if="param.context=='item' && param.multiple"
      :value="get()"
      @input="set"
      :title="'Default value: '+param.defaultValue"
      valuekey="name"
      viewkey="label"
      class="configcontrol"
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
      class="configcontrol"
      v-dynamicload:items="param.filterCriteria"
    ></ui-dropdown>

    <ui-cron-expression
      v-else-if="param.context=='cronexpression'"
      :value="get()"
      @input="set"
      class="configcontrol"
      :title="'Default value: '+param.defaultValue"
    ></ui-cron-expression>

    <div v-else-if="param.context=='location'" :title="'Default value: '+param.defaultValue">
      <input :value="get()" @input="set" ref="mapcoordinates" class="form-control configcontrol">
      <ui-maps v-if="!condensed" @change="mapChanged"></ui-maps>
    </div>

    <input
      v-else
      :title="'Default value: '+param.defaultValue"
      :value="get()"
      @input="set"
      class="form-control configcontrol"
    >

    <div class="configdesc" v-if="desc" v-html="param.description"></div>
  </div>
</template>

<script>
import { DynamicLoadMixin } from "./vue-mixin-dynamicload";

export default {
  // If condensed is true: Render an "edit" button instead of inlining the component.
  // Useful for multi-line inputs and map widgets.
  props: {
    param: Object,
    value: [String, Number, Boolean, Object],
    condensed: {
      type: Boolean,
      default: false
    },
    desc: {
      type: Boolean,
      default: true
    }
  },
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
    remove() {
      this.$emit("remove", this.param);
    },
    set(event) {
      this.$emit("input", event.target.value);
    },
    mapChanged(event) {
      this.$refs.mapcoordinates.value =
        event.target.value[0] + "," + event.target.value[1];
      this.$emit("input", this.$refs.mapcoordinates.value);
    }
  }
};
</script>