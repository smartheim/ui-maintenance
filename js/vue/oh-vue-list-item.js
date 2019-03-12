import { createNotification } from '../js/app.js'; // Pre-bundled, external reference

import Vue from 'vue/dist/vue.esm.js';

import { ItemSelectionMixin } from '../_vuecomponents/vue-mixin-itemselection';

import VueConfigElement from '../_vuecomponents/vue-config-element.vue';
import VueConfigElementWithLabel from '../_vuecomponents/vue-config-element-with-label.vue';
import VueInProgress from '../_vuecomponents/vue-inprogress';
import { DynamicLoadMixin } from '../_vuecomponents/vue-mixin-dynamicload';

export function createItemComponent(mixins, template) {
  return {
    ignoreWatch: false,
    props: ["listitem"],
    // Explicitly set the defaults, otherwise vue will do strange things with web-components
    model: { // Influences v-model behaviour: See https://vuejs.org/v2/api/#model
      prop: 'value',
      event: 'input'
    },
    template: template,
    data: function () {
      return {
        original: this.listitem, // The original item. We need the "item" copy to implement "discard".
        item: Object.assign({}, this.listitem), // A copy of the database item entry
        changed: false, // True if user has changed "item"
        inProgress: false, // Shows an overlay layer if true. Set message+messagetitle also!
        message: null, // Overlay layer: Message
        messagetitle: null, // Overlay layer: Message title
        showmeta: false, // The meta data layer is shown if true
        selected: false, // Item is selected: Influences the shadow color
        pulseAnimation: false // A pulsing animation -> used if new values have been received
      }
    },
    mixins: [ItemSelectionMixin, DynamicLoadMixin, ...mixins],
    components: {
      'vue-inprogress': VueInProgress,
      'vue-config-element': VueConfigElement,
      'vue-config-element-with-label': VueConfigElementWithLabel
    },
    methods: {
      discard: function () {
        this.ignoreWatch = true;
        this.item = Object.assign({}, this.original);
        this.inProgress = false;
        this.changed = false;
        console.log("discarded");
      },
      copyClipboard: function (event, itemid) {
        const range = document.createRange();
        range.selectNode(event.target);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("copy");

        createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
      },
      // Play pulse animation for some milliseconds
      changeNotification() {
        Vue.nextTick(() => {
          window.requestAnimationFrame(() => {
            this.pulseAnimation = true;
            if (this.pulseAnimationTimer) clearTimeout(this.pulseAnimationTimer);
            this.pulseAnimationTimer = setTimeout(() => {
              this.pulseAnimation = false;
              delete this.pulseAnimationTimer;
            }, 700);
          });
        });
      }
    },
    watch: {
      // The database entry has changed -> warn the user if he has made changes
      listitem: {
        handler: function (newVal, oldVal) {
          this.original = newVal;
          if (!this.changed) {
            this.ignoreWatch = true;
            this.item = JSON.parse(JSON.stringify(this.original));
            this.inProgress = false;
            this.changed = false;
            this.changeNotification();
          } else {
            this.message = "If you save your changes, you'll overwrite the newer version.";
            this.messagetitle = "Warning: Update received";
            this.inProgress = true;
          }
        }, deep: true, immediate: true,
      },
      item: {
        handler: function (newVal, oldVal) {
          if (this.ignoreWatch) {
            this.ignoreWatch = false;
            console.debug("ignore watch");
            return;
          }
          console.debug("list item changed", newVal);
          this.changed = true;
        }, deep: true, immediate: true,
      }
    },
    created: function () {
      this.changed = false;
      this.inProgress = false;
      this.$list = this.$root.$list;
    }
  }
};
