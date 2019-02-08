const template = `
<div :class="{show: $parent.showmeta}" class="secondlevel">
  <div style="white-space: nowrap;overflow: hidden;display: flex;align-items: center;">
    <span class="mr-2">ID:</span>
    <span :title="uniqueid" style="cursor:copy;overflow: hidden;text-overflow: ellipsis;" @click="$parent.copyClipboard($event, uniqueid)">{{uniqueid}}</span>
    <oh-doc-link title="About unique IDs" show href="contexthelp/uniqueid.md" class="link ml-2"><i class="far fa-question-circle"></i></oh-doc-link>
  </div>
  <hr class="m-0">
  <template v-if="$parent.item.storage">
    <h5>Storage <oh-doc-link show href="contexthelp/storage.md" class="link"><i class="far fa-question-circle"></i></oh-doc-link></h5>
    <div>Association: <input value="$parent.item.storage"> @ <input value="$parent.item.storage" type="number" placeholder="Position"></div>
  </template>

  <h5>Tags <oh-doc-link show href="contexthelp/tags.md" class="link"><i class="far fa-question-circle"></i></oh-doc-link></h5>
  <ui-tags v-if="$parent.item.tags" :suggestions="$parent.commontags()" :value.prop="$parent.item.tags" @input="$parent.item.tags = $event.target.value"></ui-tags>
</div>
`;

export default {
  props: ["uniqueid"],
  template: template
};