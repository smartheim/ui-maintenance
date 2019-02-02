const template = `
<div class="element" v-if="config.type=='BOOLEAN'">
    <ui-switch :label="config.label"></ui-switch>
    <small class="form-text text-muted" v-html="config.description"></small>
</div>
<div class="element" v-else-if="config.type=='TEXT' && config.limitToOptions===true">
    <ui-dropdown :value="config.defaultValue" :options.prop="convertOptions(config.options)"></ui-dropdown>
    <small class="form-text text-muted" v-html="config.description"></small>
</div>
<div class="element" style="min-width: 90%;" v-else-if="config.type=='TEXT' && config.context=='location'">
    <input :value="config.defaultValue" id="mapcoordinates">
    <small class="form-text text-muted" v-html="config.description"></small>
    <ui-maps @change="mapChanged"></ui-maps>
</div>
<div class="element" v-else-if="config.type=='TEXT'">
    <input :value="config.defaultValue">
    <small class="form-text text-muted" v-html="config.description"></small>
</div>
<div class="element" v-else-if="config.type=='DECIMAL' || config.type=='INTEGER'">
    <input type="number" :value="config.defaultValue" :min="config.min" :max="config.max">
    <small class="form-text text-muted" v-html="config.description"></small>
</div>
`;
export default {
    props: ["config"],
    template: template,
    methods: {
        convertOptions: function (optionArray) {
            var d = {};
            for (let entry of optionArray) {
                d[entry.value] = entry.label;
            }
            return d;
        },
    }
};