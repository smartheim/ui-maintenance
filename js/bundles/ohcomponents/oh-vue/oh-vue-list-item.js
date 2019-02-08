
import VueInProgress from './vue-inprogress';
import VueMetaInfo from './vue-meta-info';
import { createNotification } from '../app.js'; // Pre-bundled, external reference
import { ItemSelectionMixin } from './oh-vue-list-mixins';

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
                item: Object.assign({}, this.listitem),
                original: this.listitem,
                changed: false,
                inProgress: false,
                message: null,
                messagetitle: null,
                showmeta: false,
                selected: false
            }
        },
        mixins: [ItemSelectionMixin, ...mixins],
        components: {
            'vue-inprogress': VueInProgress,
            'vue-metainfo': VueMetaInfo
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
                var range = document.createRange();
                range.selectNode(event.target);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand("copy");

                createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
            }
        },
        watch: {
            // The database entry has changed -> warn the user if he has made changes
            listitem: {
                handler: function (newVal, oldVal) {
                    this.original = newVal;
                    if (!this.changed) {
                        this.ignoreWatch = true;
                        this.item = Object.assign({}, this.original);
                        this.inProgress = false;
                        this.changed = false;
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
        }
    }
};
