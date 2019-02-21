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

const Mixin = {
  mounted: function () {
    this.dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    this.setFilter("");
  },
  data: function () {
    return {
      items: [],
      filtered: [],
      filterString: null
    }
  },
  components: { 'dynamic-scroller': DynamicScroller, 'dynamic-scroller-item': DynamicScrollerItem },
  methods: {
    setFilter(filterString) {
      if (filterString == "") {
        this.filterString = null;
        this.filtered = this.items;
        return;
      }
      this.filterString = filterString;
      let newFilteredItems = [];
      for (let item of this.items)
        if (this.filterPass(item)) newFilteredItems.push(item);
      this.filtered = newFilteredItems;
    },
    filterPass(item) {
      if (!this.filterString) return true;
      return item.message.match(this.filterString);
    },
    newData(websocketData) {
      websocketData = websocketData.detail;
      if (!websocketData || websocketData.t !== "log") return;
      delete websocketData.t;
      if (websocketData.init) {
        for (let d of websocketData.init) this.addItem(d);
      } else {
        this.addItem(websocketData);
      }
    },
    addItem(item) {
      let copy = Object.assign({}, item);
      this.items.push(copy);
      if (this.filterString && this.filterPass(copy)) this.filtered.push(copy);
      if (this.items.length > 1000) {
        console.warn("Logbuffer too big. Pruning 800 items now");
        this.items.splice(0, 800);
        if (this.filterString) this.setFilter(this.filterString);
      }
      // isScrollBottom is a boolean prop which is true if the user is scrolled at the bottom before the new message is added
      if (!this.$_scrollingToBottom && this.isScrollBottom) {
        this.$_scrollingToBottom = true;
        this.scrollToPosition(999999999)
        console.log("scroll");
      }
    },
    scrollDown(startIndex, endIndex, maxIndex) {
      this.isScrollBottom = endIndex == maxIndex;
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
