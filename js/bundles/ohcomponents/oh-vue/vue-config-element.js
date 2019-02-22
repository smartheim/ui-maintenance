const template = `
<div class="element" v-if="param.type=='BOOLEAN'" :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
        <a v-if="canremove && value" title="Reset to default" style="align-self: center;" class="mr-2" href="#" @click.prevent="$emit('remove')">
          <i class="fas fa-undo"></i></a>
        <ui-switch :value="get()" @input="set" :label="param.label"></ui-switch>
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='TEXT' && param.limitToOptions===true &&
  param.options && param.options.length" :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
        <a v-if="canremove && value" title="Reset to default" style="align-self: center;" class="mr-2" href="#" @click.prevent="$emit('remove')">
          <i class="fas fa-undo"></i></a>
        <select class="custom-select" placeholder="Please select" :value="get()" @input="set">
            <option v-for="param of param.options" :value="param.value">{{param.label}}</option>
        </select>
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" style="min-width: 90%;" v-else-if="param.type=='TEXT' && param.context=='location'"
  :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
        <a v-if="canremove && value" title="Reset to default" style="align-self: center;" class="mr-2" href="#" @click.prevent="$emit('remove')">
          <i class="fas fa-undo"></i></a>
        <input :value="get()" @input="set" ref="mapcoordinates">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
    <ui-maps @change="mapChanged"></ui-maps>
</div>
<div class="element" v-else-if="param.type=='TEXT'" :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
        <a v-if="canremove && value" title="Reset to default" style="align-self: center;" class="mr-2" href="#" @click.prevent="$emit('remove')">
          <i class="fas fa-undo"></i></a>
        <input :value="get()" @input="set">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='DECIMAL' || param.type=='INTEGER'" :title="'Default value: '+param.defaultValue">
    <div style="display:flex">
        <a v-if="canremove && value" title="Reset to default" style="align-self: center;" class="mr-2" href="#" @click.prevent="$emit('remove')">
          <i class="fas fa-undo"></i></a>
        <input type="number" :value="get()" @input="set" :min="param.min" :max="param.max">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
`;
export default {
  props: ["param", "value", "allowremove"],
  template: template,
  computed: {
    canremove() {
      this.allowremove && this.param.defaultValue;
    }
  },
  methods: {
    get() {
      return this.value || this.param.defaultValue;
    },
    set(event) {
      this.$emit("input", event.target.value);
    },
    mapChanged(event) {
      this.$refs.mapcoordinates.value = event.target.value[0] + "," + event.target.value[1];
    }
  },
};