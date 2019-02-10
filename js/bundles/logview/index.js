/**
 * Generate articial logs via https://next.json-generator.com. Pattern:
 [
  {
  'repeat(100)': {
    _id: '{{index()}}',
    timestamp: '{{date(new Date(2014, 0, 1), new Date()).getTime()}}',
    level: '{{random("INFO", "DEBUG", "WARN", "TRACE")}}',
    source: function (tags, parent) {return lorem(3, "word").replace(/ /g,".");} ,
    message: '{{lorem(1, "sentences")}}',
  }
  }
]
 */

import { DynamicScroller, DynamicScrollerItem } from './vue-virtual-scroller';
import { fetchWithTimeout } from '../../common/fetch';
import { Vue } from './vue.js'; // Pre-bundled, external reference

const Mixin = {
    mounted: function () {
        this._incid = 100;
        this.dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric'
        });
        fetchWithTimeout("./dummydata/logs.json").then(d => d.json())
            .then(d => this.original = this.items = d)
            .then(() => setInterval(() => this.addItem(this.original[Math.floor((Math.random() * 99) + 0)]), 1000));
    },
    data: function () {
        return {
            items: [],
        }
    },
    components: { 'dynamic-scroller': DynamicScroller, 'dynamic-scroller-item': DynamicScrollerItem },
    methods: {
        addItem(item) {
            let copy = Object.assign({}, item);
            copy._id = this._incid;
            this._incid++;
            this.items.push(copy);
            this.scrollToBottom(item, true);
        },
        datetime(item) {
            return this.dateTimeFormat.format(new Date(item.timestamp));
        },
        loglevelClass(item) {
            switch (item.level) {
                case "TRACE": return "as-console-trace";
                case "INFO": return "as-console-info";
                case "DEBUG": return "as-console-debug";
                case "INFO": return "as-console-warn";
                case "ERROR": return "as-console-error";
            }
            return "as-console-warn";
        },
        scrollToBottom(item, force = true) {
            // isScrollBottom is a boolean prop which is true if the user is scrolled at the bottom before the new message is added
            if (!this.$_scrollingToBottom && (force || this.isScrollBottom)) {
                //this.scrollToPosition(999999999)
                // this.$_scrollingToBottom = true;
                this.$refs.scroller.scrollToItem(100);
                console.log("scroll");
            }
        },

        scrollToPosition(position) {
            const scroller = this.$refs.scroller.$el
            scroller.scrollTop = position
            requestAnimationFrame(() => {
                scroller.scrollTop = position
                setTimeout(() => {
                    scroller.scrollTop = position
                    this.$_scrollingToBottom = false
                }, 50)
            })
        },
    }
}

export const mixins = [Mixin];
