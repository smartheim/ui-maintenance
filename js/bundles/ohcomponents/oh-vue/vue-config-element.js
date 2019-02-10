const template = `
<div class="element" v-if="param.type=='BOOLEAN'">
    <ui-switch :value="value" @input="set" :label="param.label"></ui-switch>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='TEXT' && param.limitToOptions===true && param.options && param.options.length">
    <ui-dropdown :value="value" @input="set" valuekey="value" viewkey="label" :options.prop="param.options"></ui-dropdown>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" style="min-width: 90%;" v-else-if="param.type=='TEXT' && param.context=='location'">
    <input :value="value" @input="set" id="mapcoordinates">
    <small class="form-text text-muted" v-html="param.description"></small>
    <ui-maps @change="mapChanged"></ui-maps>
</div>
<div class="element" v-else-if="param.type=='TEXT'">
    <input :value="value" @input="set">
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='DECIMAL' || param.type=='INTEGER'">
    <input type="number" :value="value" @input="set" :min="param.min" :max="param.max">
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
`;
export default {
    props: ["param", "value"],
    template: template,
    methods: {
        set: function (event) {
            this.$emit("input", event.target.value);
        }
    },
};