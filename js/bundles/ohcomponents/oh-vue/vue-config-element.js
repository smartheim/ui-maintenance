const template = `
<div class="element" v-if="param.type=='BOOLEAN'">
    <div style="display:flex">
        <a v-if="allowremove" style="align-self: center;"  class="mr-2" href="#" @click.prevent="$emit('remove')"><i class="fas fa-minus-circle"></i></a>
        <ui-switch :value="value" @input="set" :label="param.label"></ui-switch>
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='TEXT' && param.limitToOptions===true && param.options && param.options.length">
    <div style="display:flex">
        <a v-if="allowremove" style="align-self: center;"  class="mr-2" href="#" @click.prevent="$emit('remove')"><i class="fas fa-minus-circle"></i></a>
        <select class="custom-select" placeholder="Please select" :value="value" @input="set">
            <option v-for="param of param.options" :value="param.value">{{param.label}}</option>
        </select>
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" style="min-width: 90%;" v-else-if="param.type=='TEXT' && param.context=='location'">
    <div style="display:flex">
        <a v-if="allowremove" style="align-self: center;"  class="mr-2" href="#" @click.prevent="$emit('remove')"><i class="fas fa-minus-circle"></i></a>
        <input :value="value" @input="set" id="mapcoordinates">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
    <ui-maps @change="mapChanged"></ui-maps>
</div>
<div class="element" v-else-if="param.type=='TEXT'">
    <div style="display:flex">
        <a v-if="allowremove" style="align-self: center;"  class="mr-2" href="#" @click.prevent="$emit('remove')"><i class="fas fa-minus-circle"></i></a>
        <input :value="value" @input="set">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
<div class="element" v-else-if="param.type=='DECIMAL' || param.type=='INTEGER'">
    <div style="display:flex">
        <a v-if="allowremove" style="align-self: center;"  class="mr-2" href="#" @click.prevent="$emit('remove')"><i class="fas fa-minus-circle"></i></a>
        <input type="number" :value="value" @input="set" :min="param.min" :max="param.max">
    </div>
    <small class="form-text text-muted" v-html="param.description"></small>
</div>
`;
export default {
    props: ["param", "value", "allowremove"],
    template: template,
    methods: {
        set: function (event) {
            this.$emit("input", event.target.value);
        }
    },
};