const template = `
<div class="warnDialog" v-show="$parent.inProgress">
<h4>{{$parent.messagetitle}}</h4>
<div v-if="!$parent.message" class="loader m-0"></div>
<div v-if="$parent.message">
  <div>{{$parent.message}}</div>
  <button class="btn btn-primary" @click.prevent="$parent.inProgress=false">Understood</button>
</div>
</div>
`;

export default {
    template: template
};