import { store } from '../app.js';

const now = new Date();
// Cache today's date for better isDateToday() performances. Formatted without leading 0.
const todayFormatted = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

// eslint-disable-next-line
Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date
};

// eslint-disable-next-line
Date.prototype.subtractDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() - days);
  return date
};

// eslint-disable-next-line
Date.prototype.getWeek = function () {
  let d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
};

const isDateToday = date => {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayFormatted
};

/* export const getDateOfWeek = (w, y) => {
  let d = (1 + (w - 1) * 7) // 1st of January + 7 days for each week.
  return new Date(y, 0, d)
} */

// Returns today if it's FirstDayOfWeek (Monday or Sunday) or previous FirstDayOfWeek otherwise.
const getPreviousFirstDayOfWeek = (date = null, weekStartsOnSunday) => {
  let prevFirstDayOfWeek = (date && new Date(date.valueOf())) || new Date();
  let dayModifier = weekStartsOnSunday ? 7 : 6;
  prevFirstDayOfWeek.setDate(prevFirstDayOfWeek.getDate() - (prevFirstDayOfWeek.getDay() + dayModifier) % 7);
  return prevFirstDayOfWeek
};

/**
 * @param {int} The month number, 0 based.
 * @param {int} The year, not zero based, required to account for leap years.
 * @return {Date[]} List with date objects for each day of the month.
 */
const getDaysInMonth = (month, year) => {
  let date = new Date(year, month, 1);
  let days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days
};

const nth = (d) => {
  if (d > 3 && d < 21) return 'th'
  switch (d % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
};

const formatTime = (time, format = 'HH:mm') => {
  const H = Math.floor(time / 60);
  const h = H % 12 ? H % 12 : 12;
  const am = H < 12 ? 'am' : 'pm';
  const m = Math.floor(time % 60);
  const timeObj = {
    H,
    h,
    HH: (H < 10 ? '0' : '') + H,
    hh: (h < 10 ? '0' : '') + h,
    am,
    AM: am.toUpperCase(),
    m,
    mm: (m < 10 ? '0' : '') + m
  };

  return format.replace(/(\{[a-zA-Z]+\}|[a-zA-Z]+)/g, (m, contents) => timeObj[contents.replace(/\{|\}/g, '')])
};

const formatDate = (date, format = 'yyyy-mm-dd', localizedTexts) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const dateObj = {
    D: date.getDay(), // 0 to 6.
    DD: localizedTexts.weekDays[(date.getDay() - 1 + 7) % 7][0], // M to S.
    DDD: localizedTexts.weekDays[(date.getDay() - 1 + 7) % 7].substr(0, 3), // Mon to Sun.
    DDDD: localizedTexts.weekDays[(date.getDay() - 1 + 7) % 7], // Monday to Sunday.
    d, // 1 to 31.
    dd: (d < 10 ? '0' : '') + d, // 01 to 31.
    S: nth(d), // st, nd, rd, th.
    m, // 1 to 12.
    mm: (m < 10 ? '0' : '') + m, // 01 to 12.
    mmm: localizedTexts.months[m - 1].substr(0, 3), // Jan to Dec.
    mmmm: localizedTexts.months[m - 1], // January to December.
    yyyy: date.getFullYear(), // 2018.
    yy: date.getFullYear().toString().substr(2, 4) // 18.
  };

  return format.replace(/(\{[a-zA-Z]+\}|[a-zA-Z]+)/g, (m, contents) => {
    const result = dateObj[contents.replace(/\{|\}/g, '')];
    return result !== undefined ? result : contents
  })
};

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script = {
  props: {
    cssClass: {
      type: String,
      default: ""
    },
    date: {
      type: Date,
      required: true
    },
    formattedDate: {
      type: String,
      default: ""
    },
    cellid: {
      type: Number,
      required: true
    },
    content: {
      type: [String, Number],
      default: ""
    },
    splits: {
      type: Array,
      default: () => []
    },
    today: {
      type: Boolean,
      default: false
    },
    allDayEvents: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    splitEvents: {}
  }),

  methods: {
    updateEventPosition(event) {
      const src = (event.multipleDays.daysCount && event.multipleDays) || event;
      const { startTimeMinutes, endTimeMinutes } = src;

      let minutesFromTop = startTimeMinutes - this.timeFrom;
      const top = Math.round(
        (minutesFromTop * this.timeCellHeight) / this.timeStep
      );

      minutesFromTop = Math.min(endTimeMinutes, this.timeTo) - this.timeFrom;
      const bottom = Math.round(
        (minutesFromTop * this.timeCellHeight) / this.timeStep
      );

      event.top = Math.max(top, 0);
      event.height = bottom - event.top;
    },

    eventStyles(event) {
      if (!event.startTime || this.view === "month" || this.allDayEvents)
        return {};
      const resizeAnEvent = this.domEvents.resizeAnEvent;

      return {
        top: `${event.top}px`,
        height: `${
          resizeAnEvent.newHeight && resizeAnEvent.eventId === event.id
            ? resizeAnEvent.newHeight
            : event.height
          }px`
      };
    },

    eventClasses(event) {
      const overlapping = Object.keys(event.overlapping).length;
      const overlapped = Object.keys(event.overlapped).length;
      let simultaneous = Object.keys(event.simultaneous).length + 1;
      let forceLeft = false;
      let deletable =
        this.domEvents.clickHoldAnEvent.eventId &&
        this.domEvents.dragAnEvent.eventId !== event.id &&
        (this.domEvents.clickHoldAnEvent.eventId === event.id ||
          event.linked.find(
            e => e.id === this.domEvents.clickHoldAnEvent.eventId
          ));

      if (simultaneous >= 3) {
        let split3 = simultaneous - 1;
        Object.keys(event.simultaneous).forEach(eventId => {
          if (
            split3 &&
            Object.keys(this.events.find(e => e.id === eventId).simultaneous)
              .length +
            1 <
            3
          ) {
            split3--;
          }
        });
        if (!split3) simultaneous = 2;
      } else if (simultaneous === 2) {
        const otherEvent = this.events.find(
          e => e.id === Object.keys(event.simultaneous)[0]
        );

        if (
          otherEvent &&
          Object.keys(otherEvent.overlapping).length &&
          Object.keys(otherEvent.overlapped).length
        ) {
          forceLeft = true;
        }
      }

      return {
        ...event.classes,
        "vuecal__event--dragging":
          this.domEvents.dragAnEvent.eventId &&
          this.domEvents.dragAnEvent.eventId !== event.id,
        "vuecal__event--transient": event.transient,
        "vuecal__event--focus":
          this.domEvents.focusAnEvent.eventId === event.id,
        "vuecal__event--deletable": deletable,
        "vuecal__event--overlapped": overlapped,
        "vuecal__event--overlapping": overlapping,
        "vuecal__event--split2": simultaneous === 2,
        "vuecal__event--split3": simultaneous >= 3,
        "vuecal__event--split-middle":
          overlapped && overlapping && simultaneous >= 3,
        "vuecal__event--split-left": forceLeft,
        "vuecal__event--all-day": event.allDay,
        "vuecal__event--multiple-days": Object.keys(event.multipleDays).length
      };
    },

    // Will recalculate all the overlappings of the current cell or only of the given split if provided.
    checkCellOverlappingEvents(split = 0) {
      if (this.events) {
        const foregroundEventsList = this.events.filter(
          item => !item.background && (split ? item.split === split : 1)
        );

        if (foregroundEventsList.length) {
          // Do the mapping outside of the next loop if not splitted cell.
          // If splitted need the whole event object to compare splits.
          const foregroundEventsIdList = foregroundEventsList.map(
            item => item.id
          );
          let comparisonArray = {};

          this.events.forEach(event => {
            if (!event.background) {
              let comparisonArrayKeys = Object.keys(comparisonArray);

              // Unique comparison of events.
              comparisonArray[event.id] = this.splits.length
                ? foregroundEventsList
                  .filter(
                    item =>
                      item.id !== event.id &&
                      comparisonArrayKeys.indexOf(item.id) === -1 &&
                      item.split === event.split
                  )
                  .map(item => item.id)
                : foregroundEventsIdList.filter(
                  id =>
                    id !== event.id && comparisonArrayKeys.indexOf(id) === -1
                );

              if (comparisonArray[event.id].length)
                this.checkOverlappingEvents(event, comparisonArray[event.id]);
            }
          });
        }
      }
    },

    checkOverlappingEvents(event, comparisonArray) {
      const src = (event.multipleDays.daysCount && event.multipleDays) || event;
      const {
        startTimeMinutes: startTimeMinE1,
        endTimeMinutes: endTimeMinE1
      } = src;

      comparisonArray.forEach((event2id, i) => {
        let event2 = this.events.find(item => item.id === event2id);
        const src2 =
          (event2.multipleDays.daysCount && event2.multipleDays) || event2;
        const {
          startTimeMinutes: startTimeMinE2,
          endTimeMinutes: endTimeMinE2
        } = src2;

        const event1startsFirst = startTimeMinE1 < startTimeMinE2;
        const event1overlapsEvent2 =
          !event1startsFirst && endTimeMinE2 > startTimeMinE1;
        const event2overlapsEvent1 =
          event1startsFirst && endTimeMinE1 > startTimeMinE2;

        if (event1overlapsEvent2) {
          this.$set(event.overlapping, event2.id, true);
          this.$set(event2.overlapped, event.id, true);
        } else {
          delete event.overlapping[event2.id];
          delete event2.overlapped[event.id];
        }

        if (event2overlapsEvent1) {
          this.$set(event2.overlapping, event.id, true);
          this.$set(event.overlapped, event2.id, true);
        } else {
          delete event2.overlapping[event.id];
          delete event.overlapped[event2.id];
        }

        // If up to 3 events start at the same time.
        if (
          startTimeMinE1 === startTimeMinE2 ||
          (event1overlapsEvent2 || event2overlapsEvent1)
        ) {
          this.$set(event.simultaneous, event2.id, true);
          this.$set(event2.simultaneous, event.id, true);
        } else {
          delete event.simultaneous[event2.id];
          delete event2.simultaneous[event.id];
        }

        if (this.splits.length) {
          this.splitEvents[event.split] = this.events.filter(
            e => e.split === event.split
          );
        }
      });
    },

    onResizeEvent() {
      let { eventId, newHeight } = this.$parent.domEvents.resizeAnEvent;
      let event = this.events.filter(e => e.id === eventId)[0];

      if (event) {
        event.height = Math.max(newHeight, 10);
        this.updateEndTimeOnResize(event);

        if (!event.background)
          this.checkCellOverlappingEvents(event.split || 0);
      }
    },

    updateEndTimeOnResize(event) {
      const bottom = event.top + event.height;
      const endTime =
        ((bottom / this.timeCellHeight) * this.timeStep + this.timeFrom) / 60;
      const hours = parseInt(endTime);
      const minutes = parseInt((endTime - hours) * 60);

      event.endTimeMinutes = endTime * 60;
      event.endTime = `${hours}:${(minutes < 10 ? "0" : "") + minutes}`;
      event.end = event.end.split(" ")[0] + ` ${event.endTime}`;

      if (event.multipleDays.daysCount) {
        event.multipleDays.endTimeMinutes = event.endTimeMinutes;
        event.multipleDays.endTime = event.endTime;
        event.multipleDays.end = event.end;

        event.linked.forEach(e => {
          let dayToModify = this.$parent.mutableEvents[e.date];
          let eventToModify = dayToModify.find(e2 => e2.id === e.id);

          eventToModify.endTimeMinutes = event.endTimeMinutes;
          eventToModify.endTime = event.endTime;
          eventToModify.end = event.end;
        });
      }
    },

    getPosition(e) {
      const rect = e.target.getBoundingClientRect();
      const { clientX, clientY } =
        "ontouchstart" in window && e.touches ? e.touches[0] : e;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },

    // On an event.
    onMouseDown(e, event, touch = false) {
      // Prevent a double mouse down on touch devices.
      if ("ontouchstart" in window && !touch) return false;

      let {
        clickHoldAnEvent,
        resizeAnEvent,
        dragAnEvent,
        mousedown
      } = this.domEvents;

      this.domEvents.mousedown = true;

      // If the delete button is already out and event is on focus then delete event.
      if (
        this.domEvents.focusAnEvent.eventId === event.id &&
        clickHoldAnEvent.eventId === event.id
      ) {
        return true;
      }

      // Focus the clicked event.
      this.focusEvent(event);

      clickHoldAnEvent.eventId = null; // Reinit click hold on each click.

      // Don't show delete button if dragging or resizing event.
      if (!resizeAnEvent.start && !dragAnEvent.eventId && this.editableEvents) {
        clickHoldAnEvent.timeoutId = setTimeout(() => {
          clickHoldAnEvent.eventId = event.id;
        }, clickHoldAnEvent.timeout);
      }
    },

    onDragStart(e, event) {
      let { dragAnEvent, dragging } = this.domEvents;

      this.$parent.cursorPosition = e.offsetY;
      this.$parent.dragCurrentCell = this.cellid;

      dragging = true;
      e.dataTransfer.dropEffect = "move";

      dragAnEvent = Object.assign(dragAnEvent, {
        eventId: event.id,
        eventStartDate: event.startDate
      });
    },

    onDragEnd(e, event) {
      e.preventDefault();
      let elArray = document.elementsFromPoint(e.clientX, e.clientY);
      for (let el of elArray) {
        if (el.__vue__ && el.__vue__.dragEnd) {
          const m =
            (el.__vue__.cursorPosition * this.timeStep) / this.timeCellHeight;
          el.__vue__.dragEnd(
            Math.floor((m + this.timeFrom) / 60),
            Math.floor(m + this.timeFrom) % 60
          );
          break;
        }
      }
      this.domEvents.dragging = false;
      this.$parent.cursorPosition = null;
    },

    onMouseEnter(e, event) {
      //e.preventDefault();
      this.$parent.emitWithEvent("event-mouse-enter", event);
    },

    onMouseLeave(e, event) {
      //e.preventDefault();
      this.$parent.emitWithEvent("event-mouse-leave", event);
    },

    onContextMenu(e, event) {
      e.preventDefault();
      return false;
    },

    onTouchStart(e, event) {
      this.onMouseDown(e, event, true);
    },

    onClick(e, event) {
      if (typeof this.$parent.onEventClick === "function")
        return this.$parent.onEventClick(event, e);
    },

    onDblClick(e, event) {
      if (typeof this.$parent.onEventDblclick === "function")
        return this.$parent.onEventDblclick(event, e);
    },

    onDragHandleMouseDown(e, event) {
      const start =
        "ontouchstart" in window && e.touches
          ? e.touches[0].clientY
          : e.clientY;
      let { resizeAnEvent, mousedown } = this.domEvents;

      this.domEvents.mousedown = true;

      resizeAnEvent = Object.assign(resizeAnEvent, {
        start,
        originalHeight: event.height,
        newHeight: event.height,
        eventId: event.id,
        eventStartDate: event.startDate
      });
    },

    deleteEvent(event, touch = false) {
      // Prevent a double mouse down on touch devices.
      if ("ontouchstart" in window && !touch) return false;

      this.$parent.emitWithEvent("event-delete", event);

      // Filtering from $parent.mutableEvents since current cell might only contain all day events or vice-versa.
      this.events = this.$parent.mutableEvents[this.formattedDate].filter(
        e => e.id !== event.id
      );

      // If deleting a multiple-day event, delete all the events pieces (days).
      if (event.multipleDays.daysCount) {
        event.linked.forEach(e => {
          let dayToModify = this.$parent.mutableEvents[e.date];
          let eventToDelete = dayToModify.find(e2 => e2.id === e.id);
          this.$parent.mutableEvents[e.date] = dayToModify.filter(
            e2 => e2.id !== e.id
          );

          if (!e.background) {
            // Remove this event from possible other overlapping events of the same cell.
            Object.keys(eventToDelete.overlapped).forEach(
              id =>
                delete dayToModify.find(item => item.id === id).overlapping[
                eventToDelete.id
                ]
            );
            Object.keys(eventToDelete.overlapping).forEach(
              id =>
                delete dayToModify.find(item => item.id === id).overlapped[
                eventToDelete.id
                ]
            );
            Object.keys(eventToDelete.simultaneous).forEach(
              id =>
                delete dayToModify.find(item => item.id === id).simultaneous[
                eventToDelete.id
                ]
            );
          }
        });
      }

      if (!event.background) {
        // Remove this event from possible other overlapping events of the same cell.
        Object.keys(event.overlapped).forEach(
          id =>
            delete this.events.find(item => item.id === id).overlapping[
            event.id
            ]
        );
        Object.keys(event.overlapping).forEach(
          id =>
            delete this.events.find(item => item.id === id).overlapped[event.id]
        );
        Object.keys(event.simultaneous).forEach(
          id =>
            delete this.events.find(item => item.id === id).simultaneous[
            event.id
            ]
        );

        this.checkCellOverlappingEvents(event.split || 0);
      }

      if (this.splits.length)
        this.splitEvents[event.split] = this.events.filter(
          e => e.id !== event.id && e.split === event.split
        );
    },

    touchDeleteEvent(event) {
      this.deleteEvent(event, true);
    },

    focusEvent(event) {
      this.$parent.emitWithEvent("event-focus", event);
      this.domEvents.focusAnEvent.eventId = event.id;
    }
  },

  computed: {
    texts() {
      return this.$parent.texts;
    },
    view() {
      return this.$parent.view.id;
    },
    time() {
      return this.$parent.time;
    },
    timeFormat() {
      return (
        this.$parent.timeFormat ||
        (this.$parent["12Hour"] ? "h:mm{am}" : "HH:mm")
      );
    },
    timeCellHeight() {
      return parseInt(this.$parent.timeCellHeight);
    },
    timeFrom() {
      return parseInt(this.$parent.timeFrom);
    },
    timeTo() {
      return parseInt(this.$parent.timeTo);
    },
    timeStep() {
      return parseInt(this.$parent.timeStep);
    },
    showAllDayEvents() {
      return this.$parent.showAllDayEvents;
    },
    eventsOnMonthView() {
      return this.$parent.eventsOnMonthView;
    },
    editableEvents() {
      return this.$parent.editableEvents;
    },
    draggableEvents() {
      return this.$parent.draggableEvents;
    },
    noEventOverlaps() {
      this.$nextTick(() => this.checkCellOverlappingEvents());
      return this.$parent.noEventOverlaps;
    },
    transitions() {
      return this.$parent.transitions;
    },
    transitionDirection() {
      return this.$parent.transitionDirection;
    },
    domEvents: {
      get() {
        if (this.$parent.domEvents.resizeAnEvent.eventId) this.onResizeEvent();
        return this.$parent.domEvents;
      },
      set(object) {
        this.$parent.domEvents = object;
      }
    },
    cellStyles() {
      return {
        minWidth:
          this.view === "week" && this.$parent.minCellWidth
            ? `${this.$parent.minCellWidth}px`
            : null,
        position: "relative"
      };
    },
    events: {
      get() {
        const events = this.$parent.mutableEvents[this.formattedDate] || [];
        // eslint-disable-next-line
        this.splitEvents = [];

        events.forEach(event => {
          if (event.startTime && !(this.showAllDayEvents && this.allDayEvents))
            this.updateEventPosition(event);

          // Only for splits.
          if (this.splits.length && event.split) {
            // eslint-disable-next-line
            if (!this.splitEvents[event.split])
              this.$set(this.splitEvents, event.split, []);
            // eslint-disable-next-line
            this.splitEvents[event.split].push(event);
          }
        });

        // NextTick prevents a cyclic redundancy.
        this.$nextTick(this.checkCellOverlappingEvents);

        return this.showAllDayEvents
          ? events.filter(e => !!e.allDay === this.allDayEvents)
          : events;
      },
      set(events) {
        this.$parent.mutableEvents[this.formattedDate] = events;
      }
    },
    cellSplitEvents() {
      let splitsEventIndexes = {};

      this.events.forEach((e, i) => {
        if (!splitsEventIndexes[e.split || 0])
          splitsEventIndexes[e.split || 0] = {};
        splitsEventIndexes[e.split || 0][e.id] = i;
      });

      return splitsEventIndexes;
    },
    timelineVisible() {
      if (
        !this.today ||
        !this.time ||
        this.allDayEvents ||
        ["week", "day"].indexOf(this.view) === -1
      )
        return;

      const now = new Date();
      let startTimeMinutes = now.getHours() * 60 + now.getMinutes();
      return startTimeMinutes <= this.timeTo;
    },
    todaysTimePosition() {
      // Make sure to skip the Maths if not relevant.
      if (!this.today || !this.time) return;

      const now = new Date();
      let startTimeMinutes = now.getHours() * 60 + now.getMinutes();
      let minutesFromTop = startTimeMinutes - this.timeFrom;
      return Math.round((minutesFromTop * this.timeCellHeight) / this.timeStep);
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function () {
      style.call(this, createInjectorShadow(this.$list.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

/* script */
const __vue_script__ = script;
/* template */
var __vue_render__ = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "transition-group",
    {
      staticClass: "vuecal__cell",
      class: ((_obj = {
        splitted: _vm.splits.length,
        "vuecal__cell--has-events": _vm.events.length
      }),
        (_obj[_vm.cssClass] = true),
        _obj),
      style: _vm.cellStyles,
      attrs: {
        tag: "div",
        name: "slide-fade--" + _vm.transitionDirection,
        appear: _vm.transitions
      }
    },
    [
      _vm._l(_vm.splits.length || 1, function (i) {
        return _c(
          "div",
          {
            key: _vm.transitions ? _vm.view + "-" + _vm.content + "-" + i : i,
            staticClass: "vuecal__flex vuecal__cell-content",
            class:
              _vm.splits.length &&
              "vuecal__cell-split " + _vm.splits[i - 1].class,
            attrs: { column: "column" }
          },
          [
            _vm.splits.length
              ? _c("div", {
                staticClass: "split-label",
                domProps: { innerHTML: _vm._s(_vm.splits[i - 1].label) }
              })
              : _vm._e(),
            _vm.content
              ? _c("div", {
                staticClass: "vuecal__cell-date",
                domProps: { innerHTML: _vm._s(_vm.content) }
              })
              : _vm._e(),
            !_vm.events.length &&
              (["week", "day"].indexOf(_vm.view) > -1 ||
                (_vm.view === "month" && _vm.eventsOnMonthView))
              ? _c(
                "div",
                { staticClass: "vuecal__no-event" },
                [_vm._t("no-event", [_vm._v(_vm._s(_vm.texts.noEvent))])],
                2
              )
              : _vm._e(),
            _vm.events.length &&
              (["week", "day"].indexOf(_vm.view) > -1 ||
                (_vm.view === "month" && _vm.eventsOnMonthView))
              ? _c(
                "div",
                { staticClass: "vuecal__cell-events" },
                _vm._l(
                  _vm.splits.length ? _vm.splitEvents[i] : _vm.events,
                  function (event, j) {
                    return _c(
                      "div",
                      {
                        key: j,
                        staticClass: "vuecal__event",
                        class: _vm.eventClasses(event),
                        style: _vm.eventStyles(event),
                        attrs: {
                          draggable: _vm.draggableEvents && !event.fixed
                        },
                        on: {
                          mouseenter: function ($event) {
                            _vm.onMouseEnter($event, event);
                          },
                          mouseleave: function ($event) {
                            _vm.onMouseLeave($event, event);
                          },
                          mousedown: function ($event) {
                            _vm.onMouseDown($event, event);
                          },
                          dragstart: function ($event) {
                            _vm.onDragStart($event, event);
                          },
                          dragend: function ($event) {
                            _vm.onDragEnd($event, event);
                          },
                          contextmenu: function ($event) {
                            _vm.onContextMenu($event, event);
                          },
                          touchstart: function ($event) {
                            _vm.onTouchStart($event, event);
                          },
                          click: function ($event) {
                            _vm.onClick($event, event);
                          },
                          dblclick: function ($event) {
                            _vm.onDblClick($event, event);
                          }
                        }
                      },
                      [
                        _vm.editableEvents
                          ? _c(
                            "div",
                            {
                              staticClass: "vuecal__event-delete",
                              on: {
                                mousedown: function ($event) {
                                  $event.stopPropagation();
                                  $event.preventDefault();
                                  _vm.deleteEvent(event);
                                },
                                touchstart: function ($event) {
                                  $event.stopPropagation();
                                  $event.preventDefault();
                                  _vm.touchDeleteEvent(event);
                                }
                              }
                            },
                            [_vm._v(_vm._s(_vm.texts.deleteEvent))]
                          )
                          : _vm._e(),
                        _vm._t("event-renderer", null, {
                          event: event,
                          view: _vm.view
                        }),
                        _vm.editableEvents &&
                          _vm.time &&
                          event.startTime &&
                          !_vm.allDayEvents &&
                          !event.multipleDays.start &&
                          !event.multipleDays.middle &&
                          _vm.view !== "month"
                          ? _c("div", {
                            staticClass: "vuecal__event-resize-handle",
                            on: {
                              mousedown: function ($event) {
                                _vm.editableEvents &&
                                  _vm.time &&
                                  _vm.onDragHandleMouseDown($event, event);
                              },
                              touchstart: function ($event) {
                                _vm.editableEvents &&
                                  _vm.time &&
                                  _vm.onDragHandleMouseDown($event, event);
                              }
                            }
                          })
                          : _vm._e()
                      ],
                      2
                    )
                  }
                ),
                0
              )
              : _vm._e(),
            _vm.view === "month" &&
              !_vm.eventsOnMonthView &&
              _vm.events.length &&
              !_vm.allDayEvents
              ? _vm._t("events-count-month-view", null, { events: _vm.events })
              : _vm._e()
          ],
          2
        )
      }),
      _vm.timelineVisible
        ? _c("div", {
          key: _vm.transitions ? _vm.view + "-now-line" : "now-line",
          staticClass: "vuecal__now-line",
          style: "top: " + _vm.todaysTimePosition + "px"
        })
        : _vm._e(),
      _vm.$parent.dragCurrentCell == _vm.cellid
        ? _c(
          "div",
          {
            key: "dragline",
            staticClass: "uecal__cursor-line",
            style: "top: " + _vm.$parent.cursorPosition + "px"
          },
          [_c("span", [_vm._v(_vm._s(_vm.texts.noEvent))])]
        )
        : _vm._e()
    ],
    2
  )
  var _obj;
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

/* style */
const __vue_inject_styles__ = undefined;
/* scoped */
const __vue_scope_id__ = undefined;
/* module identifier */
const __vue_module_identifier__ = undefined;
/* functional template */
const __vue_is_functional_template__ = false;
/* style inject */

/* style inject SSR */



var Cell = normalizeComponent(
  { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
  __vue_inject_styles__,
  __vue_script__,
  __vue_scope_id__,
  __vue_is_functional_template__,
  __vue_module_identifier__,
  undefined,
  undefined
);

//

const VueCal = {
  name: "vue-cal",
  components: { "vuecal-cell": Cell },
  props: {
    locale: {
      type: String,
      default: "en"
    },
    hideViewSelector: {
      type: Boolean,
      default: false
    },
    hideTitleBar: {
      type: Boolean,
      default: false
    },
    hideBody: {
      type: Boolean,
      default: false
    },
    hideWeekends: {
      type: Boolean,
      default: false
    },
    disableViews: {
      type: Array,
      default: () => []
    },
    defaultView: {
      type: String,
      default: "week"
    },
    showAllDayEvents: {
      type: Boolean,
      default: false
    },
    selectedDate: {
      type: [String, Date],
      default: ""
    },
    startWeekOnSunday: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    xsmall: {
      type: Boolean,
      default: false
    },
    clickToNavigate: {
      type: Boolean,
      default: false
    },
    dblClickToNavigate: {
      type: Boolean,
      default: true
    },
    time: {
      type: Boolean,
      default: true
    },
    timeFrom: {
      type: Number,
      default: 0 // In minutes.
    },
    timeTo: {
      type: Number,
      default: 24 * 60 // In minutes.
    },
    timeStep: {
      type: Number,
      default: 60 // In minutes.
    },
    timeCellHeight: {
      type: Number,
      default: 40 // In pixels.
    },
    "12Hour": {
      type: Boolean,
      default: false
    },
    timeFormat: {
      type: String,
      default: ""
    },
    minCellWidth: {
      type: Number,
      default: 0
    },
    splitDays: {
      type: Array,
      default: () => []
    },
    editableEvents: {
      type: Boolean,
      default: false
    },
    draggableEvents: {
      type: Boolean,
      default: false
    },
    noEventOverlaps: {
      type: Boolean,
      default: false
    },
    eventsOnMonthView: {
      type: [Boolean, String],
      default: false
    },
    onEventClick: {
      type: Function,
      default: () => { }
    },
    onEventDblclick: {
      type: Function,
      default: () => { }
    },
    transitions: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    texts: {
      weekDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      years: "Years",
      year: "Year",
      month: "Month",
      week: "Week",
      day: "Day",
      today: "Today",
      noEvent: "No Event",
      deleteEvent: "Delete",
      createEvent: "Create an event",
      dateFormat: "DDDD mmmm d{S}, yyyy"
    },

    cursorPosition: null,
    dragCurrentCell: null,
    ready: false,
    now,
    view: {
      id: "",
      title: "",
      startDate: null,
      selectedDate: null
    },
    eventIdIncrement: 1,
    domEvents: {
      mousedown: false,
      dragging: false,
      resizeAnEvent: {
        eventId: null, // Only one at a time.
        start: null,
        originalHeight: 0,
        newHeight: 0
      },
      dragAnEvent: {
        eventId: null, // Only one at a time.
        start: null
      },
      focusAnEvent: {
        eventId: null // Only one at a time.
      },
      clickHoldAnEvent: {
        eventId: null, // Only one at a time.
        timeout: 1200,
        timeoutId: null
      },
      dblTapACell: {
        taps: 0,
        timeout: 500
      }
    },
    mutableEvents: {}, // An indexed array of mutable events updated each time given events array changes.
    transitionDirection: "right"
  }),

  methods: {
    previous() {
      this.transitionDirection = "left";

      switch (this.view.id) {
        case "years":
          this.switchView(
            this.view.id,
            new Date(this.view.startDate.getFullYear() - 25, 0, 1)
          );
          break;
        case "year":
          const firstDayOfYear = new Date(
            this.view.startDate.getFullYear() - 1,
            1,
            1
          );
          this.switchView(this.view.id, firstDayOfYear);
          break;
        case "month":
          const firstDayOfMonth = new Date(
            this.view.startDate.getFullYear(),
            this.view.startDate.getMonth() - 1,
            1
          );
          this.switchView(this.view.id, firstDayOfMonth);
          break;
        case "week":
          const firstDayOfPrevWeek = getPreviousFirstDayOfWeek(
            this.view.startDate,
            this.startWeekOnSunday
          ).subtractDays(7);
          this.switchView(this.view.id, firstDayOfPrevWeek);
          break;
        case "day":
          const day = this.view.startDate.subtractDays(1);
          this.switchView(this.view.id, day);
          break;
      }
    },

    next() {
      this.transitionDirection = "right";

      switch (this.view.id) {
        case "years":
          this.switchView(
            this.view.id,
            new Date(this.view.startDate.getFullYear() + 25, 0, 1)
          );
          break;
        case "year":
          const firstDayOfYear = new Date(
            this.view.startDate.getFullYear() + 1,
            0,
            1
          );
          this.switchView(this.view.id, firstDayOfYear);
          break;
        case "month":
          const firstDayOfMonth = new Date(
            this.view.startDate.getFullYear(),
            this.view.startDate.getMonth() + 1,
            1
          );
          this.switchView(this.view.id, firstDayOfMonth);
          break;
        case "week":
          const firstDayOfNextWeek = getPreviousFirstDayOfWeek(
            this.view.startDate,
            this.startWeekOnSunday
          ).addDays(7);
          this.switchView(this.view.id, firstDayOfNextWeek);
          break;
        case "day":
          const day = this.view.startDate.addDays(1);
          this.switchView(this.view.id, day);
          break;
      }
    },

    switchToBroaderView() {
      this.transitionDirection = "left";

      if (this.broaderView) this.switchView(this.broaderView);
    },

    switchToNarrowerView() {
      this.transitionDirection = "right";

      let views = Object.keys(this.views);
      views = views.slice(views.indexOf(this.view.id) + 1);
      const view = views.find(v => this.views[v].enabled);

      if (view) this.switchView(view);
    },

    switchView(view, date = null, fromViewSelector = false) {
      if (this.transitions && fromViewSelector) {
        const views = Object.keys(this.views);
        this.transitionDirection =
          views.indexOf(this.view.id) > views.indexOf(view) ? "left" : "right";
      }

      this.view.events = [];
      this.view.id = view;
      let dateTmp, endTime, formattedDate, dayEvents;

      if (!date) {
        date = this.view.selectedDate || this.view.startDate;
        if (view === "week")
          date = getPreviousFirstDayOfWeek(date, this.startWeekOnSunday);
      }

      switch (view) {
        case "years":
          // Always fill first cell with a multiple of 25 years, E.g. year 2000, or 2025.
          this.view.startDate = new Date(
            Math.floor(date.getFullYear() / 25) * 25 || 2000,
            0,
            1
          );
          this.view.endDate = new Date(
            this.view.startDate.getFullYear() + 26,
            0,
            0
          );
          break;
        case "year":
          this.view.startDate = new Date(date.getFullYear(), 0, 1);
          this.view.endDate = new Date(date.getFullYear() + 1, 0, 0);
          break;
        case "month":
          this.view.startDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          );
          this.view.endDate = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
          );
          dateTmp = new Date(this.view.startDate);
          endTime = this.view.endDate.getTime();
          while (dateTmp.getTime() <= endTime) {
            dateTmp = dateTmp.addDays(1);
            formattedDate = formatDate(dateTmp, "yyyy-mm-dd", this.texts);
            dayEvents = this.mutableEvents[formattedDate] || [];
            if (dayEvents.length)
              this.view.events.push(
                ...dayEvents.map(e => this.cleanupEvent(e))
              );
          }
          break;
        case "week":
          this.view.startDate =
            this.hideWeekends && this.startWeekOnSunday
              ? date.addDays(1)
              : date;
          this.view.endDate = date.addDays(7);
          dateTmp = new Date(date);
          for (let i = 0; i < 7; i++) {
            formattedDate = formatDate(
              dateTmp.addDays(i),
              "yyyy-mm-dd",
              this.texts
            );
            dayEvents = this.mutableEvents[formattedDate] || [];
            if (dayEvents.length)
              this.view.events.push(
                ...dayEvents.map(e => this.cleanupEvent(e))
              );
          }
          break;
        case "day":
          this.view.startDate = date;
          this.view.endDate = date;
          dayEvents =
            this.mutableEvents[formatDate(date, "yyyy-mm-dd", this.texts)] ||
            [];
          if (dayEvents.length)
            this.view.events = dayEvents.map(e => this.cleanupEvent(e));
          break;
      }

      const params = {
        view,
        startDate: this.view.startDate,
        endDate: this.view.endDate,
        events: this.view.events,
        ...(view === "week" ? { week: this.view.startDate.getWeek() } : {})
      };
      this.$emit("view-change", params);
    },

    findAncestor(el, Class) {
      while ((el = el.parentElement) && !el.classList.contains(Class));
      return el;
    },

    isDOMElementAnEvent(el) {
      return (
        el.classList.contains("vuecal__event") ||
        this.findAncestor(el, "vuecal__event")
      );
    },

    onDragEnter(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },

    onCellMouseMove(e, cellid) {
      if (e.offsetY < 10) return;
      this.cursorPosition = e.offsetY;
      this.dragCurrentCell = cellid;
    },
    onDragOver(e, cell, cellid) {
      e.dataTransfer.dropEffect = "move";
      if (e.offsetY == -1) {
        console.trace();
        return;
      }
      this.dragCurrentCell = cellid;
    },

    dragEnd(hour, minute) {
      let { dragAnEvent } = this.domEvents;
      if (dragAnEvent.eventId) {
        let event = this.mutableEvents[dragAnEvent.eventStartDate].find(
          item => item.id === dragAnEvent.eventId
        );
        event.transient = true;
        let d = this.viewCells[this.dragCurrentCell].date;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
        event.start = event.end = d;
        if (event) {
          this.emitWithEvent("event-change", event);
        }
        dragAnEvent.eventId = null;
      }
    },

    selectCell(cell) {
      if (this.view.selectedDate.toString() !== cell.date.toString()) {
        this.view.selectedDate = cell.date;
        this.$emit("day-focus", cell.date);
      }

      // Switch to narrower view.
      if (this.clickToNavigate) this.switchToNarrowerView();
      // Handle double click manually for touch devices.
      else if (this.dblClickToNavigate && "ontouchstart" in window) {
        this.domEvents.dblTapACell.taps++;

        setTimeout(
          () => (this.domEvents.dblTapACell.taps = 0),
          this.domEvents.dblTapACell.timeout
        );

        if (this.domEvents.dblTapACell.taps >= 2) {
          this.domEvents.dblTapACell.taps = 0;
          this.switchToNarrowerView();
        }
      }
    },

    // Event resizing is started in cell component (onMouseDown) but place onMouseMove & onMouseUp
    // handlers in the single parent for performance.
    onMouseMove(e) {
      let { resizeAnEvent, mousedown, dragging } = this.domEvents;

      if (mousedown) {
        e.preventDefault();
        this.domEvents.dragging = true;

        const y = "ontouchstart" in window ? e.touches[0].clientY : e.clientY;
        resizeAnEvent.newHeight =
          resizeAnEvent.originalHeight + (y - resizeAnEvent.start);
      }
    },

    onMouseUp(e) {
      let {
        focusAnEvent,
        resizeAnEvent,
        clickHoldAnEvent,
        dragAnEvent,
        mousedown,
        dragging
      } = this.domEvents;

      // On event resize end, emit event.
      if (resizeAnEvent.eventId) {
        let event = this.mutableEvents[resizeAnEvent.eventStartDate].find(
          item => item.id === resizeAnEvent.eventId
        );
        if (event) {
          this.emitWithEvent("event-change", event);
          this.emitWithEvent("event-duration-change", event);
        }
      }

      // If not mouse up on an event, unfocus any event except if just dragged.
      if (!this.isDOMElementAnEvent(e.target) && !resizeAnEvent.eventId) {
        focusAnEvent.eventId = null; // Cancel event focus.
        clickHoldAnEvent.eventId = null; // Hide delete button.
      }

      // Prevent showing delete button if click and hold was not long enough.
      // Click & hold timeout happens in onMouseDown() in cell component.
      if (clickHoldAnEvent.timeoutId && !clickHoldAnEvent.eventId) {
        clearTimeout(clickHoldAnEvent.timeoutId);
        clickHoldAnEvent.timeoutId = null;
      }

      // Any mouse up must cancel event resizing and event dragging.
      resizeAnEvent.eventId = null;
      resizeAnEvent.start = null;
      resizeAnEvent.originalHeight = null;
      resizeAnEvent.newHeight = null;
      dragAnEvent.eventId = null;
      dragAnEvent.start = null;

      this.domEvents.mousedown = false;
      this.domEvents.dragging = false;
    },

    onEventTitleBlur(e, event) {
      event.title = e.target.innerHTML;

      if (event.linked.daysCount) {
        event.linked.forEach(e => {
          let dayToModify = this.mutableEvents[e.date];
          dayToModify.find(e2 => e2.id === e.id).title = event.title;
        });
      }

      this.emitWithEvent("event-change", event);
      this.emitWithEvent("event-title-change", event);
    },

    // Object of arrays of events indexed by dates.
    updateMutableEvents(events) {
      // eslint-disable-next-line
      this.mutableEvents = {};

      // Group events into dates.
      events.map(event => {
        // Keep the event ids scoped to this calendar instance.
        // eslint-disable-next-line
        let id = `${this._uid}_${this.eventIdIncrement++}`;

        event = Object.assign(
          {
            id,
            startDate:
              event.start.getFullYear() +
              "-" +
              String(event.start.getMonth()).padStart(2, "0") +
              "-" +
              String(event.start.getDate()).padStart(2, "0"),
            startTime: event.start.toLocaleTimeString(),
            startTimeMinutes:
              event.start.getHours() * 60 + event.start.getMinutes(),
            endDate:
              event.end.getFullYear() +
              "-" +
              String(event.end.getMonth()).padStart(2, "0") +
              "-" +
              String(event.end.getDate()).padStart(2, "0"),
            endTime: event.end.toLocaleTimeString(),
            endTimeMinutes: event.end.getHours() * 60 + event.end.getMinutes(),
            height: 0,
            top: 0,
            overlapped: {},
            overlapping: {},
            simultaneous: {},
            linked: [], // Linked events.
            multipleDays: {},
            allDay: false
          },
          event
        );
        const multipleDays = event.startDate != event.endDate;
        event.classes = {
          [event.class]: true,
          "vuecal__event--background": event.background,
          "vuecal__event--multiple-days": multipleDays,
          "event-start": multipleDays
        };

        // Make array reactive for future events creations & deletions.
        if (!(event.startDate in this.mutableEvents))
          this.$set(this.mutableEvents, event.startDate, []);
        // eslint-disable-next-line
        this.mutableEvents[event.startDate].push(event);

        if (multipleDays) {
          // Create an array of linked events to attach to each event piece (piece = 1 day),
          // So that deletion and modification reflects on all the pieces.
          let eventPieces = [];

          const oneDayInMs = 24 * 60 * 60 * 1000;
          const [y1, m1, d1] = startDate.split("-");
          const [y2, m2, d2] = endDate.split("-");
          startDate = new Date(y1, parseInt(m1) - 1, d1);
          endDate = new Date(y2, parseInt(m2) - 1, d2);
          const datesDiff = Math.round(
            Math.abs((startDate.getTime() - endDate.getTime()) / oneDayInMs)
          );

          // Update First day event.
          event.multipleDays = {
            start: true,
            startDate,
            startTime,
            startTimeMinutes,
            endDate: startDate,
            endTime: "24:00",
            endTimeMinutes: 24 * 60,
            daysCount: datesDiff + 1
          };

          // Generate event pieces ids to link them all together
          // and update the first event linked events array with all ids of pieces.
          for (let i = 1; i <= datesDiff; i++) {
            const date = formatDate(
              new Date(startDate).addDays(i),
              "yyyy-mm-dd",
              this.texts
            );
            eventPieces.push({
              id: `${this._uid}_${this.eventIdIncrement++}`,
              date
            });
          }
          event.linked = eventPieces;

          // Create 1 event per day and link them all.
          for (let i = 1; i <= datesDiff; i++) {
            const date = eventPieces[i - 1].date;
            const linked = [
              { id: event.id, date: event.startDate },
              ...eventPieces
                .slice(0)
                .filter(e => e.id !== eventPieces[i - 1].id)
            ];

            // Make array reactive for future events creations & deletions.
            if (!(date in this.mutableEvents))
              this.$set(this.mutableEvents, date, []);

            this.mutableEvents[date].push({
              ...event,
              id: eventPieces[i - 1].id,
              overlapped: {},
              overlapping: {},
              simultaneous: {},
              linked,
              // All the dates in the multipleDays object property are related
              // to the current event piece (only 1 day) not the whole event.
              multipleDays: {
                start: false,
                middle: i < datesDiff,
                end: i === datesDiff,
                startDate: date,
                startTime: "00:00",
                startTimeMinutes: 0,
                endDate: date,
                endTime: i === datesDiff ? endTime : "24:00",
                endTimeMinutes: i === datesDiff ? endTimeMinutes : 24 * 60,
                daysCount: datesDiff + 1
              },
              classes: {
                ...event.classes,
                "event-start": false,
                "event-middle": i < datesDiff,
                "event-end": i === datesDiff
              }
            });
          }
        }

        return event;
      });
    },

    // Prepare the event to return it with an emitted event.
    cleanupEvent(event) {
      event = { ...event };

      // Delete vue-cal specific props instead of returning a set of props so user
      // can place whatever they want inside an event and see it returned.
      const discardProps = [
        "height",
        "top",
        "overlapped",
        "overlapping",
        "simultaneous",
        "classes",
        "split"
      ];
      for (let prop in event)
        if (discardProps.indexOf(prop) > -1) delete event[prop];
      if (!event.multipleDays.daysCount) delete event.multipleDays;

      return event;
    },

    emitWithEvent(eventName, event) {
      this.$emit(eventName, this.cleanupEvent(event));
    },

    updateSelectedDate(date) {
      if (date && typeof date === "string") {
        let [, y, m, d, h = 0, min = 0] = date.match(
          /(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/
        );
        date = new Date(y, parseInt(m) - 1, d, h, min);
      }
      if (date && (typeof date === "string" || date instanceof Date)) {
        if (this.view.selectedDate)
          this.transitionDirection =
            this.view.selectedDate.getTime() > date.getTime()
              ? "left"
              : "right";
        this.view.selectedDate = date;
        this.switchView(this.view.id);
        window.requestAnimationFrame(() => {
          const nowLine = document.querySelector(".vuecal__now-line");
          if (nowLine) nowLine.scrollIntoView();
        });
      }
    }
  },

  mounted() {
    if (this.editableEvents) {
      const hasTouch = "ontouchstart" in window;
      window.addEventListener(
        hasTouch ? "touchmove" : "mousemove",
        this.onMouseMove,
        { passive: false }
      );
      window.addEventListener(
        hasTouch ? "touchend" : "mouseup",
        this.onMouseUp
      );
    }

    // Init the array of events, then keep listening for changes in watcher.
    this.updateMutableEvents([]);

    this.view.id = this.defaultView;
    if (!this.selectedDate) {
      this.selectedDate = this.now;
    }
    this.updateSelectedDate(this.selectedDate);

    this.ready = true;
  },

  beforeDestroy() {
    const hasTouch = "ontouchstart" in window;
    window.removeEventListener(
      hasTouch ? "touchmove" : "mousemove",
      this.onMouseMove,
      { passive: false }
    );
    window.removeEventListener(
      hasTouch ? "touchend" : "mouseup",
      this.onMouseUp
    );
  },

  computed: {
    views() {
      return {
        years: {
          label: this.texts.years,
          enabled: this.disableViews.indexOf("years") === -1
        },
        year: {
          label: this.texts.year,
          enabled: this.disableViews.indexOf("year") === -1
        },
        month: {
          label: this.texts.month,
          enabled: this.disableViews.indexOf("month") === -1
        },
        week: {
          label: this.texts.week,
          enabled: this.disableViews.indexOf("week") === -1
        },
        day: {
          label: this.texts.day,
          enabled: this.disableViews.indexOf("day") === -1
        }
      };
    },
    broaderView() {
      let views = Object.keys(this.views);
      views = views.slice(0, views.indexOf(this.view.id));
      views.reverse();

      return views.find(v => this.views[v].enabled);
    },
    hasTimeColumn() {
      return this.time && ["week", "day"].indexOf(this.view.id) > -1;
    },
    // For week & day views.
    timeCells() {
      let timeCells = [];
      for (
        let i = this.timeFrom, max = this.timeTo;
        i < max;
        i += this.timeStep
      ) {
        timeCells.push({
          hours: Math.floor(i / 60),
          minutes: i % 60,
          label: formatTime(
            i,
            this.timeFormat || (this["12Hour"] ? "h:mm{am}" : "HH:mm")
          ),
          value: i
        });
      }

      return timeCells;
    },
    // Whether the current view has days splits.
    hasSplits() {
      return (
        !!this.splitDays.length && ["week", "day"].indexOf(this.view.id) > -1
      );
    },
    weekDays() {
      let { weekDays } = this.texts;
      // Do not modify original for next instances.
      weekDays = weekDays.slice(0);

      if (this.startWeekOnSunday) weekDays.unshift(weekDays.pop());

      if (this.hideWeekends) {
        weekDays = this.startWeekOnSunday
          ? weekDays.slice(1, 6)
          : weekDays.slice(0, 5);
      }

      return weekDays.map(day => ({ label: day }));
    },
    months() {
      return this.texts.months.map(month => ({ label: month }));
    },
    viewTitle() {
      let title = "";
      const date = this.view.startDate;
      const year = date.getFullYear();
      const month = date.getMonth();

      switch (this.view.id) {
        case "years":
          title = this.texts.years;
          break;
        case "year":
          title = year;
          break;
        case "month":
          title = `${this.months[month].label} ${year}`;
          break;
        case "week":
          const lastDayOfWeek = date.addDays(6);
          let formattedMonthYear = formatDate(
            date,
            this.xsmall ? "mmm yyyy" : "mmmm yyyy",
            this.texts
          );

          // If week is not ending in the same month it started in.
          if (lastDayOfWeek.getMonth() !== date.getMonth()) {
            let [m1, y1] = formattedMonthYear.split(" ");
            let [m2, y2] = formatDate(
              lastDayOfWeek,
              this.xsmall ? "mmm yyyy" : "mmmm yyyy",
              this.texts
            ).split(" ");
            formattedMonthYear =
              y1 === y2 ? `${m1} - ${m2} ${y1}` : `${m1} ${y1} - ${m2} ${y2}`;
          }
          title = `${
            this.texts.week
            } ${date.getWeek()} (${formattedMonthYear})`;
          break;
        case "day":
          title = formatDate(date, this.texts.dateFormat, this.texts);
          break;
      }

      return title;
    },
    viewHeadings() {
      let headings = [];

      switch (this.view.id) {
        case "month":
        case "week":
          let todayFound = false;
          headings = this.weekDays.map((cell, i) => {
            let date = this.view.startDate.addDays(i);
            // Only for week view.
            let isToday =
              this.view.id === "week" &&
              !todayFound &&
              isDateToday(date) &&
              !todayFound++;

            return {
              label1:
                this.locale === "zh-cn"
                  ? cell.label.substr(0, 2)
                  : cell.label[0],
              label2:
                this.locale === "zh-cn"
                  ? cell.label.substr(2)
                  : cell.label.substr(1, 2),
              label3: this.locale === "zh-cn" ? "" : cell.label.substr(3),
              // Only for week view:
              ...(this.view.id === "week" ? { label4: date.getDate() } : {}),
              ...(this.view.id === "week" ? { today: isToday } : {}),
              class: {
                today: isToday // Doesn't need condition cz if class object is false it doesn't show up.
              }
            };
          });
          break;
      }
      return headings;
    },
    viewCells() {
      let cells = [];
      let fromYear = null;
      let todayFound = false;

      switch (this.view.id) {
        case "years":
          fromYear = this.view.startDate.getFullYear();
          cells = Array.apply(null, Array(25)).map((cell, i) => {
            return {
              content: fromYear + i,
              date: new Date(fromYear + i, 0, 1),
              class: {
                current: fromYear + i === this.now.getFullYear(),
                selected:
                  this.view.selectedDate &&
                  fromYear + i === this.view.selectedDate.getFullYear()
              }
            };
          });
          break;
        case "year":
          fromYear = this.view.startDate.getFullYear();
          cells = Array.apply(null, Array(12)).map((cell, i) => {
            return {
              content: this.xsmall
                ? this.months[i].label.substr(0, 3)
                : this.months[i].label,
              date: new Date(fromYear, i, 1),
              class: {
                current:
                  i === this.now.getMonth() &&
                  fromYear === this.now.getFullYear(),
                selected:
                  i === this.view.selectedDate.getMonth() &&
                  fromYear === this.view.selectedDate.getFullYear()
              }
            };
          });
          break;
        case "month":
          const month = this.view.startDate.getMonth();
          const year = this.view.startDate.getFullYear();
          let days = getDaysInMonth(month, year);
          const firstOfMonthDayOfWeek = days[0].getDay();
          let selectedDateAtMidnight = new Date(
            this.view.selectedDate.getTime()
          );
          selectedDateAtMidnight.setHours(0, 0, 0, 0);
          todayFound = false;
          let nextMonthDays = 0;

          // If the first day of the month is not a FirstDayOfWeek (Monday or Sunday), prepend missing days to the days array.
          if (days[0].getDay() !== 1) {
            let d = getPreviousFirstDayOfWeek(days[0], this.startWeekOnSunday);
            let prevWeek = [];
            for (let i = 0; i < 7; i++) {
              prevWeek.push(new Date(d));
              d.setDate(d.getDate() + 1);

              if (d.getDay() === firstOfMonthDayOfWeek) break;
            }

            days.unshift(...prevWeek);
          }

          // Create 42 cells (6 rows x 7 days) and populate them with days.
          cells = Array.apply(null, Array(42)).map((cell, i) => {
            const cellDate =
              days[i] || new Date(year, month + 1, ++nextMonthDays);
            // To increase performance skip checking isToday if today already found.
            const isToday =
              !todayFound &&
              cellDate &&
              cellDate.getDate() === this.now.getDate() &&
              cellDate.getMonth() === this.now.getMonth() &&
              cellDate.getFullYear() === this.now.getFullYear() &&
              !todayFound++;
            const formattedDate = formatDate(
              cellDate,
              "yyyy-mm-dd",
              this.texts
            );

            return {
              content: cellDate.getDate(),
              date: cellDate,
              formattedDate,
              today: isToday,
              class: {
                today: isToday,
                "out-of-scope": cellDate.getMonth() !== month,
                selected:
                  this.view.selectedDate &&
                  cellDate.getTime() === selectedDateAtMidnight.getTime()
              }
            };
          });

          if (this.hideWeekends) {
            cells = cells.filter(
              cell => cell.date.getDay() > 0 && cell.date.getDay() < 6
            );
          }
          break;
        case "week":
          todayFound = false;
          let firstDayOfWeek = this.view.startDate;

          cells = this.weekDays.map((cell, i) => {
            const date = firstDayOfWeek.addDays(i);
            const formattedDate = formatDate(date, "yyyy-mm-dd", this.texts);
            let isToday = !todayFound && isDateToday(date) && !todayFound++;

            return {
              date,
              formattedDate,
              today: isToday,
              class: {
                today: isToday,
                selected:
                  this.view.selectedDate &&
                  firstDayOfWeek.addDays(i).getTime() ===
                  this.view.selectedDate.getTime()
              }
            };
          });
          break;
        case "day":
          const formattedDate = formatDate(
            this.view.startDate,
            "yyyy-mm-dd",
            this.texts
          );
          const isToday = isDateToday(this.view.startDate);

          cells = [
            {
              date: this.view.startDate,
              formattedDate,
              today: isToday,
              class: {
                today: isToday,
                selected:
                  this.view.selectedDate &&
                  this.view.startDate.getTime() ===
                  this.view.selectedDate.getTime()
              }
            }
          ];
          break;
      }
      return cells;
    },
    weekdayCellStyles() {
      return {
        minWidth:
          this.view.id === "week" && this.minCellWidth
            ? `${this.minCellWidth}px`
            : null
      };
    },
    cssClasses() {
      return {
        [`vuecal--${this.view.id}-view`]: true,
        [`vuecal--${this.locale}`]: this.locale,
        "vuecal--no-time": !this.time,
        "vuecal--view-with-time": this.hasTimeColumn,
        "vuecal--time-12-hour": this["12Hour"],
        "vuecal--click-to-navigate": this.clickToNavigate,
        "vuecal--hide-weekends": this.hideWeekends,
        "vuecal--split-days": this.splitDays.length,
        "vuecal--overflow-x": this.minCellWidth,
        "vuecal--small": this.small,
        "vuecal--xsmall": this.xsmall,
        "vuecal--no-event-overlaps": this.noEventOverlaps,
        "vuecal--events-on-month-view": this.eventsOnMonthView,
        "vuecal--short-events":
          this.view.id === "month" && this.eventsOnMonthView === "short"
      };
    }
  },

  filters: {
    formatTime(value, format) {
      return value && (formatTime(value, format) || "");
    }
  },

  watch: {
    selectedDate: function (date) {
      this.updateSelectedDate(date);
    }
  }
};

/* script */
const __vue_script__$1 = VueCal;
/* template */
var __vue_render__$1 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _vm.ready
    ? _c(
      "div",
      {
        staticClass: "vuecal__flex vuecal",
        class: _vm.cssClasses,
        attrs: { column: "column", lang: _vm.locale }
      },
      [
        _c("div", { staticClass: "vuecal__header" }, [
          !_vm.hideViewSelector
            ? _c(
              "ul",
              { staticClass: "vuecal__flex vuecal__menu" },
              _vm._l(_vm.views, function (v, id) {
                return v.enabled
                  ? _c(
                    "li",
                    {
                      class: { active: _vm.view.id === id },
                      on: {
                        click: function ($event) {
                          _vm.switchView(id, null, true);
                        }
                      }
                    },
                    [_vm._v(_vm._s(v.label))]
                  )
                  : _vm._e()
              }),
              0
            )
            : _vm._e(),
          !_vm.hideTitleBar
            ? _c(
              "div",
              { staticClass: "vuecal__title" },
              [
                _c(
                  "div",
                  {
                    staticClass: "vuecal__arrow vuecal__arrow--prev",
                    on: { click: _vm.previous }
                  },
                  [
                    _vm._t("arrowPrev", [_c("i", { staticClass: "angle" })])
                  ],
                  2
                ),
                _c(
                  "transition",
                  {
                    staticClass: "flex text-xs-center",
                    class: { clickable: !!_vm.broaderView },
                    attrs: {
                      name: "slide-fade--" + _vm.transitionDirection
                    }
                  },
                  [
                    _c(
                      "span",
                      {
                        key: _vm.transitions ? _vm.viewTitle : false,
                        staticClass: "d-inline-block",
                        on: {
                          click: function ($event) {
                            _vm.switchToBroaderView();
                          }
                        }
                      },
                      [
                        _vm._t("title", [_vm._v(_vm._s(_vm.viewTitle))], {
                          title: _vm.viewTitle,
                          view: _vm.view
                        })
                      ],
                      2
                    )
                  ]
                ),
                _c(
                  "div",
                  {
                    staticClass: "vuecal__arrow vuecal__arrow--next",
                    on: { click: _vm.next }
                  },
                  [
                    _vm._t("arrowNext", [_c("i", { staticClass: "angle" })])
                  ],
                  2
                )
              ],
              1
            )
            : _vm._e(),
          _vm.viewHeadings.length &&
            !(_vm.hasSplits && _vm.view.id === "week")
            ? _c(
              "div",
              { staticClass: "vuecal__flex vuecal__weekdays-headings" },
              _vm._l(_vm.viewHeadings, function (heading, i) {
                return _c(
                  "div",
                  {
                    key: i,
                    staticClass: "vuecal__flex vuecal__heading",
                    class: heading.class
                  },
                  [
                    _c(
                      "transition",
                      {
                        attrs: {
                          name: "slide-fade--" + _vm.transitionDirection,
                          appear: _vm.transitions
                        }
                      },
                      [
                        _c(
                          "span",
                          {
                            key: _vm.transitions
                              ? i + "-" + heading.label4
                              : false
                          },
                          [
                            _vm._l(3, function (j) {
                              return _c("span", { key: j }, [
                                _vm._v(_vm._s(heading["label" + j]))
                              ])
                            }),
                            heading.label4
                              ? _c("span", [_vm._v(" ")])
                              : _vm._e(),
                            heading.label4
                              ? _c("span", [_vm._v(_vm._s(heading.label4))])
                              : _vm._e()
                          ],
                          2
                        )
                      ]
                    )
                  ],
                  1
                )
              }),
              0
            )
            : _vm._e(),
          _vm.showAllDayEvents &&
            _vm.time &&
            ["week", "day"].indexOf(_vm.view.id) > -1
            ? _c("div", { staticClass: "vuecal__flex vuecal__all-day" }, [
              _vm._m(0),
              _c(
                "div",
                {
                  staticClass: "vuecal__flex vuecal__cells",
                  class: _vm.view.id + "-view",
                  attrs: {
                    grow: "grow",
                    wrap: !_vm.hasSplits || _vm.view.id !== "week",
                    column: _vm.hasSplits
                  }
                },
                _vm._l(_vm.viewCells, function (cell, i) {
                  return _c(
                    "vuecal-cell",
                    {
                      key: i,
                      class: cell.class,
                      attrs: {
                        "data-id": i,
                        cellid: i,
                        date: cell.date,
                        "formatted-date": cell.formattedDate,
                        "all-day-events": true,
                        today: cell.today,
                        splits:
                          (["week", "day"].indexOf(_vm.view.id) > -1 &&
                            _vm.splitDays) ||
                          []
                      },
                      nativeOn: {
                        dragover: function ($event) {
                          $event.target.dataset.id &&
                            _vm.onDragOver($event, cell, i);
                        },
                        dragenter: function ($event) {
                          _vm.onDragEnter($event);
                        },
                        drop: function ($event) {
                          $event.preventDefault();
                        },
                        click: function ($event) {
                          _vm.selectCell(cell);
                        },
                        dblclick: function ($event) {
                          _vm.dblClickToNavigate &&
                            _vm.switchToNarrowerView();
                        }
                      },
                      scopedSlots: _vm._u([
                        {
                          key: "event-renderer",
                          fn: function (ref) {
                            var event = ref.event;
                            var view = ref.view;
                            return _c(
                              "div",
                              { attrs: { view: view, event: event } },
                              [
                                _vm._t(
                                  "event-renderer",
                                  [
                                    _vm.editableEvents && event.title
                                      ? _c("div", {
                                        staticClass:
                                          "vuecal__event-title vuecal__event-title--edit",
                                        attrs: {
                                          contenteditable:
                                            "contenteditable"
                                        },
                                        domProps: {
                                          innerHTML: _vm._s(event.title)
                                        },
                                        on: {
                                          blur: function ($event) {
                                            _vm.onEventTitleBlur(
                                              $event,
                                              event
                                            );
                                          }
                                        }
                                      })
                                      : event.title
                                        ? _c(
                                          "div",
                                          {
                                            staticClass:
                                              "vuecal__event-title"
                                          },
                                          [_vm._v(_vm._s(event.title))]
                                        )
                                        : _vm._e()
                                  ],
                                  { view: view, event: event }
                                )
                              ],
                              2
                            )
                          }
                        }
                      ])
                    },
                    [_vm._t("no-event", null, { slot: "no-event" })],
                    2
                  )
                }),
                1
              )
            ])
            : _vm._e()
        ]),
        !_vm.hideBody
          ? _c(
            "div",
            {
              staticClass: "vuecal__flex vuecal__body",
              attrs: { grow: "grow" }
            },
            [
              _c(
                "transition",
                {
                  attrs: { name: "slide-fade--" + _vm.transitionDirection }
                },
                [
                  _c(
                    "div",
                    {
                      key: _vm.transitions ? _vm.view.id : false,
                      class: { vuecal__flex: !_vm.hasTimeColumn },
                      staticStyle: { "min-width": "100%" }
                    },
                    [
                      _c(
                        "div",
                        {
                          staticClass: "vuecal__bg",
                          attrs: { grow: "grow" }
                        },
                        [
                          _vm.time &&
                            ["week", "day"].indexOf(_vm.view.id) > -1
                            ? _c(
                              "div",
                              { staticClass: "vuecal__time-column" },
                              _vm._l(_vm.timeCells, function (cell, i) {
                                return _c(
                                  "div",
                                  {
                                    key: i,
                                    staticClass: "vuecal__time-cell",
                                    style:
                                      "height: " +
                                      _vm.timeCellHeight +
                                      "px"
                                  },
                                  [
                                    _vm._t(
                                      "time-cell",
                                      [
                                        _c(
                                          "span",
                                          { staticClass: "line" },
                                          [_vm._v(_vm._s(cell.label))]
                                        )
                                      ],
                                      {
                                        hours: cell.hours,
                                        minutes: cell.minutes
                                      }
                                    )
                                  ],
                                  2
                                )
                              }),
                              0
                            )
                            : _vm._e(),
                          _c(
                            "div",
                            {
                              staticClass: "vuecal__flex vuecal__cells",
                              class: _vm.view.id + "-view",
                              attrs: {
                                grow: "grow",
                                wrap:
                                  !_vm.hasSplits || _vm.view.id !== "week",
                                column: _vm.hasSplits
                              }
                            },
                            [
                              _vm.hasSplits && _vm.view.id === "week"
                                ? _c(
                                  "div",
                                  {
                                    staticClass:
                                      "vuecal__flex vuecal__weekdays-headings"
                                  },
                                  _vm._l(_vm.viewHeadings, function (
                                    heading,
                                    i
                                  ) {
                                    return _c(
                                      "div",
                                      {
                                        key: i,
                                        staticClass:
                                          "vuecal__flex vuecal__heading",
                                        class: heading.class,
                                        style: _vm.weekdayCellStyles
                                      },
                                      [
                                        _c(
                                          "transition",
                                          {
                                            attrs: {
                                              name:
                                                "slide-fade--" +
                                                _vm.transitionDirection,
                                              appear: _vm.transitions
                                            }
                                          },
                                          [
                                            _c(
                                              "span",
                                              {
                                                key: _vm.transitions
                                                  ? i +
                                                  "-" +
                                                  heading.label4
                                                  : false
                                              },
                                              [
                                                _vm._l(3, function (j) {
                                                  return _c(
                                                    "span",
                                                    { key: j },
                                                    [
                                                      _vm._v(
                                                        _vm._s(
                                                          heading[
                                                          "label" + j
                                                          ]
                                                        )
                                                      )
                                                    ]
                                                  )
                                                }),
                                                heading.label4
                                                  ? _c("span", [
                                                    _vm._v(" ")
                                                  ])
                                                  : _vm._e(),
                                                heading.label4
                                                  ? _c("span", [
                                                    _vm._v(
                                                      _vm._s(
                                                        heading.label4
                                                      )
                                                    )
                                                  ])
                                                  : _vm._e()
                                              ],
                                              2
                                            )
                                          ]
                                        )
                                      ],
                                      1
                                    )
                                  }),
                                  0
                                )
                                : _vm._e(),
                              _c(
                                "div",
                                {
                                  staticClass: "vuecal__flex",
                                  attrs: {
                                    grow: "grow",
                                    wrap:
                                      !_vm.hasSplits ||
                                      _vm.view.id !== "week"
                                  }
                                },
                                _vm._l(_vm.viewCells, function (cell, i) {
                                  return _c(
                                    "vuecal-cell",
                                    {
                                      key: i,
                                      class: cell.class,
                                      attrs: {
                                        "data-id": i,
                                        cellid: i,
                                        date: cell.date,
                                        "formatted-date":
                                          cell.formattedDate,
                                        today: cell.today,
                                        content: cell.content,
                                        splits:
                                          (["week", "day"].indexOf(
                                            _vm.view.id
                                          ) > -1 &&
                                            _vm.splitDays) ||
                                          []
                                      },
                                      nativeOn: {
                                        mousemove: function ($event) {
                                          _vm.onCellMouseMove($event, i);
                                        },
                                        dragover: function ($event) {
                                          $event.target.dataset.id &&
                                            _vm.onDragOver($event, cell, i);
                                        },
                                        dragenter: function ($event) {
                                          _vm.onDragEnter($event);
                                        },
                                        drop: function ($event) {
                                          $event.preventDefault();
                                        },
                                        click: function ($event) {
                                          _vm.selectCell(cell);
                                        },
                                        dblclick: function ($event) {
                                          _vm.dblClickToNavigate &&
                                            _vm.switchToNarrowerView();
                                        }
                                      },
                                      scopedSlots: _vm._u([
                                        {
                                          key: "events-count-month-view",
                                          fn: function (ref) {
                                            var events = ref.events;
                                            return _c(
                                              "div",
                                              {
                                                staticClass:
                                                  "vuecal__cell-events-count",
                                                attrs: { events: events }
                                              },
                                              [
                                                _vm._t(
                                                  "events-count-month-view",
                                                  [
                                                    events.length
                                                      ? _c("span", [
                                                        _vm._v(
                                                          _vm._s(
                                                            events.length
                                                          )
                                                        )
                                                      ])
                                                      : _vm._e()
                                                  ],
                                                  { events: events }
                                                )
                                              ],
                                              2
                                            )
                                          }
                                        },
                                        {
                                          key: "event-renderer",
                                          fn: function (ref) {
                                            var event = ref.event;
                                            var view = ref.view;
                                            return _c(
                                              "div",
                                              {
                                                attrs: {
                                                  view: view,
                                                  event: event
                                                }
                                              },
                                              [
                                                _vm._t(
                                                  "event-renderer",
                                                  [
                                                    _vm.editableEvents &&
                                                      event.title
                                                      ? _c("div", {
                                                        staticClass:
                                                          "vuecal__event-title vuecal__event-title--edit",
                                                        attrs: {
                                                          contenteditable:
                                                            "contenteditable"
                                                        },
                                                        domProps: {
                                                          innerHTML: _vm._s(
                                                            event.title
                                                          )
                                                        },
                                                        on: {
                                                          blur: function (
                                                            $event
                                                          ) {
                                                            _vm.onEventTitleBlur(
                                                              $event,
                                                              event
                                                            );
                                                          }
                                                        }
                                                      })
                                                      : event.title
                                                        ? _c(
                                                          "div",
                                                          {
                                                            staticClass:
                                                              "vuecal__event-title"
                                                          },
                                                          [
                                                            _vm._v(
                                                              _vm._s(
                                                                event.title
                                                              )
                                                            )
                                                          ]
                                                        )
                                                        : _vm._e(),
                                                    event.startTimeMinutes &&
                                                      !(
                                                        view === "month" &&
                                                        _vm.eventsOnMonthView ===
                                                        "short"
                                                      )
                                                      ? _c(
                                                        "div",
                                                        {
                                                          staticClass:
                                                            "vuecal__event-time"
                                                        },
                                                        [
                                                          _vm._v(
                                                            _vm._s(
                                                              _vm._f(
                                                                "formatTime"
                                                              )(
                                                                event.startTimeMinutes,
                                                                _vm.timeFormat ||
                                                                (_vm
                                                                  .$props[
                                                                  "12Hour"
                                                                ]
                                                                  ? "h:mm{am}"
                                                                  : "HH:mm")
                                                              )
                                                            )
                                                          ),
                                                          event.endTimeMinutes
                                                            ? _c("span", [
                                                              _vm._v(
                                                                " - " +
                                                                _vm._s(
                                                                  _vm._f(
                                                                    "formatTime"
                                                                  )(
                                                                    event.endTimeMinutes,
                                                                    _vm.timeFormat ||
                                                                    (_vm
                                                                      .$props[
                                                                      "12Hour"
                                                                    ]
                                                                      ? "h:mm{am}"
                                                                      : "HH:mm")
                                                                  )
                                                                )
                                                              )
                                                            ])
                                                            : _vm._e(),
                                                          event
                                                            .multipleDays
                                                            .daysCount
                                                            ? _c(
                                                              "small",
                                                              {
                                                                staticClass:
                                                                  "days-to-end"
                                                              },
                                                              [
                                                                _vm._v(
                                                                  " +" +
                                                                  _vm._s(
                                                                    event
                                                                      .multipleDays
                                                                      .daysCount -
                                                                    1
                                                                  ) +
                                                                  _vm._s(
                                                                    _vm.texts.day[0].toLowerCase()
                                                                  )
                                                                )
                                                              ]
                                                            )
                                                            : _vm._e()
                                                        ]
                                                      )
                                                      : _vm._e(),
                                                    event.content &&
                                                      !(
                                                        view === "month" &&
                                                        _vm.eventsOnMonthView ===
                                                        "short"
                                                      )
                                                      ? _c("div", {
                                                        staticClass:
                                                          "vuecal__event-content",
                                                        domProps: {
                                                          innerHTML: _vm._s(
                                                            event.content
                                                          )
                                                        }
                                                      })
                                                      : _vm._e()
                                                  ],
                                                  {
                                                    view: view,
                                                    event: event
                                                  }
                                                )
                                              ],
                                              2
                                            )
                                          }
                                        }
                                      ])
                                    },
                                    [
                                      _vm._t(
                                        "no-event",
                                        [_vm._v(_vm._s(_vm.texts.noEvent))],
                                        { slot: "no-event" }
                                      )
                                    ],
                                    2
                                  )
                                }),
                                1
                              )
                            ]
                          )
                        ]
                      )
                    ]
                  )
                ]
              )
            ],
            1
          )
          : _vm._e()
      ]
    )
    : _vm._e()
};
var __vue_staticRenderFns__$1 = [
  function () {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("span", { staticStyle: { width: "3em" } }, [
      _c("span", [_vm._v("All day")])
    ])
  }
];
__vue_render__$1._withStripped = true;

/* style */
const __vue_inject_styles__$1 = undefined;
/* scoped */
const __vue_scope_id__$1 = undefined;
/* module identifier */
const __vue_module_identifier__$1 = undefined;
/* functional template */
const __vue_is_functional_template__$1 = false;
/* style inject */

/* style inject SSR */



var index = normalizeComponent(
  { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
  __vue_inject_styles__$1,
  __vue_script__$1,
  __vue_scope_id__$1,
  __vue_is_functional_template__$1,
  __vue_module_identifier__$1,
  undefined,
  undefined
);

var VueSlideBar = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{ref:"wrap",staticClass:"vue-slide-bar-component vue-slide-bar-horizontal",style:(_vm.calculateHeight),attrs:{"id":"wrap"},on:{"click":_vm.wrapClick}},[_c('div',{ref:"elem",staticClass:"vue-slide-bar",style:({height: `${_vm.lineHeight}px`}),attrs:{"id":"slider"}},[[_c('div',{ref:"tooltip",staticClass:"vue-slide-bar-always vue-slide-bar-tooltip-container",style:({'width': `${_vm.iconWidth}px`}),on:{"mousedown":_vm.moveStart,"touchstart":_vm.moveStart}},[(_vm.showTooltip)?_c('span',{staticClass:"vue-slide-bar-tooltip-top vue-slide-bar-tooltip-wrap"},[_vm._t("tooltip",[_c('span',{staticClass:"vue-slide-bar-tooltip",style:(_vm.tooltipStyles)},[_vm._v(_vm._s(_vm.val))])])],2):_vm._e()])],_vm._v(" "),_c('div',{ref:"process",staticClass:"vue-slide-bar-process",style:(_vm.processStyle)})],2),_vm._v(" "),(_vm.range)?_c('div',{staticClass:"vue-slide-bar-range"},_vm._l((_vm.range),function(r,index){return _c('div',{key:index,staticClass:"vue-slide-bar-separate",style:(_vm.dataLabelStyles)},[(!r.isHide)?_c('span',{staticClass:"vue-slide-bar-separate-text"},[_vm._v(" "+_vm._s(r.label)+" ")]):_vm._e()])})):_vm._e()])},staticRenderFns: [],
  name: 'VueSlideBar',
  data () {
    return {
      flag: false,
      size: 0,
      currentValue: 0,
      currentSlider: 0,
      isComponentExists: true,
      interval: 1,
      lazy: false,
      realTime: false,
      dataLabelStyles: {
        'color': '#4a4a4a',
        'font-family': 'Arial, sans-serif',
        'font-size': '12px',
        ...this.$props.labelStyles
      }
    }
  },
  props: {
    data: {
      type: Array,
      default: null
    },
    range: {
      type: Array,
      default: null
    },
    speed: {
      type: Number,
      default: 0.5
    },
    lineHeight: {
      type: Number,
      default: 5
    },
    iconWidth: {
      type: Number,
      default: 20
    },
    value: {
      type: [String, Number],
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    isDisabled: {
      type: Boolean,
      default: false
    },
    draggable: {
      type: Boolean,
      default: true
    },
    paddingless: {
      type: Boolean,
      default: false
    },
    tooltipStyles: Object,
    labelStyles: Object,
    processStyle: Object
  },
  computed: {
    slider () {
      return this.$refs.tooltip
    },
    val: {
      get () {
        return this.data ? this.data[this.currentValue] : this.currentValue
      },
      set (val) {
        if (this.data) {
          let index = this.data.indexOf(val);
          if (index > -1) {
            this.currentValue = index;
          }
        } else {
          this.currentValue = val;
        }
      }
    },
    currentIndex () {
      return (this.currentValue - this.minimum) / this.spacing
    },
    indexRange () {
      return [0, this.currentIndex]
    },
    minimum () {
      return this.data ? 0 : this.min
    },
    maximum () {
      return this.data ? (this.data.length - 1) : this.max
    },
    multiple () {
      let decimals = `${this.interval}`.split('.')[1];
      return decimals ? Math.pow(10, decimals.length) : 1
    },
    spacing () {
      return this.data ? 1 : this.interval
    },
    total () {
      if (this.data) {
        return this.data.length - 1
      } else if (Math.floor((this.maximum - this.minimum) * this.multiple) % (this.interval * this.multiple) !== 0) {
        this.printError('[VueSlideBar error]: Prop[interval] is illegal, Please make sure that the interval can be divisible');
      }
      return (this.maximum - this.minimum) / this.interval
    },
    gap () {
      return this.size / this.total
    },
    position () {
      return ((this.currentValue - this.minimum) / this.spacing * this.gap)
    },
    limit () {
      return [0, this.size]
    },
    valueLimit () {
      return [this.minimum, this.maximum]
    },
    calculateHeight () {
      return this.paddingless ? {} : { 'padding-top': '40px', 'min-height': this.range ? '100px' : null }
    }
  },
  watch: {
    value (val) {
      if (this.flag) this.setValue(val);
      else this.setValue(val, this.speed);
    },
    max (val) {
      if (val < this.min) {
        return this.printError('[VueSlideBar error]: The maximum value can not be less than the minimum value.')
      }
      let resetVal = this.limitValue(this.val);
      this.setValue(resetVal);
      this.refresh();
    },
    min (val) {
      if (val > this.max) {
        return this.printError('[VueSlideBar error]: The minimum value can not be greater than the maximum value.')
      }
      let resetVal = this.limitValue(this.val);
      this.setValue(resetVal);
      this.refresh();
    }
  },
  methods: {
    bindEvents () {
      document.addEventListener('touchmove', this.moving, {passive: false});
      document.addEventListener('touchend', this.moveEnd, {passive: false});
      document.addEventListener('mousemove', this.moving);
      document.addEventListener('mouseup', this.moveEnd);
      document.addEventListener('mouseleave', this.moveEnd);
      window.addEventListener('resize', this.refresh);
    },
    unbindEvents () {
      window.removeEventListener('resize', this.refresh);
      document.removeEventListener('touchmove', this.moving);
      document.removeEventListener('touchend', this.moveEnd);
      document.removeEventListener('mousemove', this.moving);
      document.removeEventListener('mouseup', this.moveEnd);
      document.removeEventListener('mouseleave', this.moveEnd);
    },
    getPos (e) {
      this.realTime && this.getStaticData();
      return e.clientX - this.offset
    },
    wrapClick (e) {
      if (this.isDisabled || (!this.draggable && e.target.id === 'wrap')) return false
      let pos = this.getPos(e);
      this.setValueOnPos(pos);
    },
    moveStart (e, index) {
      if (!this.draggable) return false
      this.flag = true;
      this.$emit('dragStart', this);
    },
    moving (e) {
      if (!this.flag || !this.draggable) return false
      e.preventDefault();
      if (e.targetTouches && e.targetTouches[0]) e = e.targetTouches[0];
      this.setValueOnPos(this.getPos(e), true);
    },
    moveEnd (e) {
      if (this.flag && this.draggable) {
        this.$emit('dragEnd', this);
        if (this.lazy && this.isDiff(this.val, this.value)) {
          this.syncValue();
        }
      } else {
        return false
      }
      this.flag = false;
      this.setPosition();
    },
    setValueOnPos (pos, isDrag) {
      let range = this.limit;
      let valueRange = this.valueLimit;
      if (pos >= range[0] && pos <= range[1]) {
        this.setTransform(pos);
        let v = (Math.round(pos / this.gap) * (this.spacing * this.multiple) + (this.minimum * this.multiple)) / this.multiple;
        this.setCurrentValue(v, isDrag);
      } else if (pos < range[0]) {
        this.setTransform(range[0]);
        this.setCurrentValue(valueRange[0]);
        if (this.currentSlider === 1) this.currentSlider = 0;
      } else {
        this.setTransform(range[1]);
        this.setCurrentValue(valueRange[1]);
        if (this.currentSlider === 0) this.currentSlider = 1;
      }
    },
    isDiff (a, b) {
      if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
        return true
      } else if (Array.isArray(a) && a.length === b.length) {
        return a.some((v, i) => v !== b[i])
      }
      return a !== b
    },
    setCurrentValue (val, bool) {
      if (val < this.minimum || val > this.maximum) return false
      if (this.isDiff(this.currentValue, val)) {
        this.currentValue = val;
        if (!this.lazy || !this.flag) {
          this.syncValue();
        }
      }
      bool || this.setPosition();
    },
    setIndex (val) {
      val = this.spacing * val + this.minimum;
      this.setCurrentValue(val);
    },
    setValue (val, speed) {
      if (this.isDiff(this.val, val)) {
        let resetVal = this.limitValue(val);
        this.val = resetVal;
        this.syncValue();
      }
      this.$nextTick(() => this.setPosition(speed));
    },
    setPosition (speed) {
      if (!this.flag) this.setTransitionTime(speed === undefined ? this.speed : speed);
      else this.setTransitionTime(0);
      this.setTransform(this.position);
    },
    setTransform (val) {
      let value = val - ((this.$refs.tooltip.scrollWidth - 2) / 2);
      let translateValue = `translateX(${value}px)`;
      this.slider.style.transform = translateValue;
      this.slider.style.WebkitTransform = translateValue;
      this.slider.style.msTransform = translateValue;
      this.$refs.process.style.width = `${val}px`;
      this.$refs.process.style['left'] = 0;
    },
    setTransitionTime (time) {
      this.slider.style.transitionDuration = `${time}s`;
      this.slider.style.WebkitTransitionDuration = `${time}s`;
      this.$refs.process.style.transitionDuration = `${time}s`;
      this.$refs.process.style.WebkitTransitionDuration = `${time}s`;
    },
    limitValue (val) {
      if (this.data) {
        return val
      }
      const inRange = (v) => {
        if (v < this.min) {
          this.printError(`[VueSlideBar warn]: The value of the slider is ${val}, the minimum value is ${this.min}, the value of this slider can not be less than the minimum value`);
          return this.min
        } else if (v > this.max) {
          this.printError(`[VueSlideBar warn]: The value of the slider is ${val}, the maximum value is ${this.max}, the value of this slider can not be greater than the maximum value`);
          return this.max
        }
        return v
      };
      return inRange(val)
    },
    syncValue () {
      let val = this.val;
      if (this.range) {
        this.$emit('callbackRange', this.range[this.currentIndex]);
      }
      this.$emit('input', val);
    },
    getValue () {
      return this.val
    },
    getIndex () {
      return this.currentIndex
    },
    getStaticData () {
      if (this.$refs.elem) {
        this.size = this.$refs.elem.offsetWidth;
        this.offset = this.$refs.elem.getBoundingClientRect().left;
      }
    },
    refresh () {
      if (this.$refs.elem) {
        this.getStaticData();
        this.setPosition();
      }
    },
    printError (msg) {
      console.error(msg);
    }
  },
  mounted () {
    this.isComponentExists = true;
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return this.printError('[VueSlideBar error]: window or document is undefined, can not be initialization.')
    }
    this.$nextTick(() => {
      if (this.isComponentExists) {
        this.getStaticData();
        this.setValue(this.limitValue(this.value), 0);
        this.bindEvents();
      }
    });
  },
  beforeDestroy () {
    this.isComponentExists = false;
    this.unbindEvents();
  }
};

class StringUtilities {
    static format(template, ...values) {
        return template.replace(/%s/g, function () {
            return values.shift();
        });
    }
    static containsAny(text, searchStrings) {
        return searchStrings.some(c => {
            return text.indexOf(c) > -1;
        });
    }
}

class CronParser {
    constructor(expression, dayOfWeekStartIndexZero = true) {
        this.expression = expression;
        this.dayOfWeekStartIndexZero = dayOfWeekStartIndexZero;
    }
    parse() {
        let parsed = this.extractParts(this.expression);
        this.normalize(parsed);
        this.validate(parsed);
        return parsed;
    }
    extractParts(expression) {
        if (!this.expression) {
            throw new Error("Expression is empty");
        }
        let parsed = expression.trim().split(" ");
        if (parsed.length < 5) {
            throw new Error(`Expression has only ${parsed.length} part${parsed.length == 1 ? "" : "s"}. At least 5 parts are required.`);
        }
        else if (parsed.length == 5) {
            parsed.unshift("");
            parsed.push("");
        }
        else if (parsed.length == 6) {
            if (/\d{4}$/.test(parsed[5])) {
                parsed.unshift("");
            }
            else {
                parsed.push("");
            }
        }
        else if (parsed.length > 7) {
            throw new Error(`Expression has ${parsed.length} parts; too many!`);
        }
        return parsed;
    }
    normalize(expressionParts) {
        expressionParts[3] = expressionParts[3].replace("?", "*");
        expressionParts[5] = expressionParts[5].replace("?", "*");
        if (expressionParts[0].indexOf("0/") == 0) {
            expressionParts[0] = expressionParts[0].replace("0/", "*/");
        }
        if (expressionParts[1].indexOf("0/") == 0) {
            expressionParts[1] = expressionParts[1].replace("0/", "*/");
        }
        if (expressionParts[2].indexOf("0/") == 0) {
            expressionParts[2] = expressionParts[2].replace("0/", "*/");
        }
        if (expressionParts[3].indexOf("1/") == 0) {
            expressionParts[3] = expressionParts[3].replace("1/", "*/");
        }
        if (expressionParts[4].indexOf("1/") == 0) {
            expressionParts[4] = expressionParts[4].replace("1/", "*/");
        }
        if (expressionParts[5].indexOf("1/") == 0) {
            expressionParts[5] = expressionParts[5].replace("1/", "*/");
        }
        if (expressionParts[6].indexOf("1/") == 0) {
            expressionParts[6] = expressionParts[6].replace("1/", "*/");
        }
        expressionParts[5] = expressionParts[5].replace(/(^\d)|([^#/\s]\d)/g, t => {
            let dowDigits = t.replace(/\D/, "");
            let dowDigitsAdjusted = dowDigits;
            if (this.dayOfWeekStartIndexZero) {
                if (dowDigits == "7") {
                    dowDigitsAdjusted = "0";
                }
            }
            else {
                dowDigitsAdjusted = (parseInt(dowDigits) - 1).toString();
            }
            return t.replace(dowDigits, dowDigitsAdjusted);
        });
        if (expressionParts[5] == "L") {
            expressionParts[5] = "6";
        }
        if (expressionParts[3] == "?") {
            expressionParts[3] = "*";
        }
        if (expressionParts[3].indexOf("W") > -1 &&
            (expressionParts[3].indexOf(",") > -1 || expressionParts[3].indexOf("-") > -1)) {
            throw new Error("The 'W' character can be specified only when the day-of-month is a single day, not a range or list of days.");
        }
        var days = {
            SUN: 0,
            MON: 1,
            TUE: 2,
            WED: 3,
            THU: 4,
            FRI: 5,
            SAT: 6
        };
        for (let day in days) {
            expressionParts[5] = expressionParts[5].replace(new RegExp(day, "gi"), days[day].toString());
        }
        var months = {
            JAN: 1,
            FEB: 2,
            MAR: 3,
            APR: 4,
            MAY: 5,
            JUN: 6,
            JUL: 7,
            AUG: 8,
            SEP: 9,
            OCT: 10,
            NOV: 11,
            DEC: 12
        };
        for (let month in months) {
            expressionParts[4] = expressionParts[4].replace(new RegExp(month, "gi"), months[month].toString());
        }
        if (expressionParts[0] == "0") {
            expressionParts[0] = "";
        }
        if (!/\*|\-|\,|\//.test(expressionParts[2]) &&
            (/\*|\//.test(expressionParts[1]) || /\*|\//.test(expressionParts[0]))) {
            expressionParts[2] += `-${expressionParts[2]}`;
        }
        for (let i = 0; i < expressionParts.length; i++) {
            if (expressionParts[i] == "*/1") {
                expressionParts[i] = "*";
            }
            if (expressionParts[i].indexOf("/") > -1 && !/^\*|\-|\,/.test(expressionParts[i])) {
                let stepRangeThrough = null;
                switch (i) {
                    case 4:
                        stepRangeThrough = "12";
                        break;
                    case 5:
                        stepRangeThrough = "6";
                        break;
                    case 6:
                        stepRangeThrough = "9999";
                        break;
                    default:
                        stepRangeThrough = null;
                        break;
                }
                if (stepRangeThrough != null) {
                    let parts = expressionParts[i].split("/");
                    expressionParts[i] = `${parts[0]}-${stepRangeThrough}/${parts[1]}`;
                }
            }
        }
    }
    validate(parsed) {
        this.assertNoInvalidCharacters("DOW", parsed[5]);
        this.assertNoInvalidCharacters("DOM", parsed[3]);
    }
    assertNoInvalidCharacters(partDescription, expression) {
        let invalidChars = expression.match(/[A-KM-VX-Z]+/gi);
        if (invalidChars && invalidChars.length) {
            throw new Error(`${partDescription} part contains invalid values: '${invalidChars.toString()}'`);
        }
    }
}

class ExpressionDescriptor {
    constructor(expression, options) {
        this.expression = expression;
        this.options = options;
        this.expressionParts = new Array(5);
        if (ExpressionDescriptor.locales[options.locale]) {
            this.i18n = ExpressionDescriptor.locales[options.locale];
        }
        else {
            console.warn(`Locale '${options.locale}' could not be found; falling back to 'en'.`);
            this.i18n = ExpressionDescriptor.locales["en"];
        }
        if (options.use24HourTimeFormat === undefined) {
            options.use24HourTimeFormat = this.i18n.use24HourTimeFormatByDefault();
        }
    }
    static toString(expression, { throwExceptionOnParseError = true, verbose = false, dayOfWeekStartIndexZero = true, use24HourTimeFormat, locale = "en" } = {}) {
        let options = {
            throwExceptionOnParseError: throwExceptionOnParseError,
            verbose: verbose,
            dayOfWeekStartIndexZero: dayOfWeekStartIndexZero,
            use24HourTimeFormat: use24HourTimeFormat,
            locale: locale
        };
        let descripter = new ExpressionDescriptor(expression, options);
        return descripter.getFullDescription();
    }
    static initialize(localesLoader) {
        ExpressionDescriptor.specialCharacters = ["/", "-", ",", "*"];
        localesLoader.load(ExpressionDescriptor.locales);
    }
    getFullDescription() {
        let description = "";
        try {
            let parser = new CronParser(this.expression, this.options.dayOfWeekStartIndexZero);
            this.expressionParts = parser.parse();
            var timeSegment = this.getTimeOfDayDescription();
            var dayOfMonthDesc = this.getDayOfMonthDescription();
            var monthDesc = this.getMonthDescription();
            var dayOfWeekDesc = this.getDayOfWeekDescription();
            var yearDesc = this.getYearDescription();
            description += timeSegment + dayOfMonthDesc + dayOfWeekDesc + monthDesc + yearDesc;
            description = this.transformVerbosity(description, this.options.verbose);
            description = description.charAt(0).toLocaleUpperCase() + description.substr(1);
        }
        catch (ex) {
            if (!this.options.throwExceptionOnParseError) {
                description = this.i18n.anErrorOccuredWhenGeneratingTheExpressionD();
            }
            else {
                throw `${ex}`;
            }
        }
        return description;
    }
    getTimeOfDayDescription() {
        let secondsExpression = this.expressionParts[0];
        let minuteExpression = this.expressionParts[1];
        let hourExpression = this.expressionParts[2];
        let description = "";
        if (!StringUtilities.containsAny(minuteExpression, ExpressionDescriptor.specialCharacters) &&
            !StringUtilities.containsAny(hourExpression, ExpressionDescriptor.specialCharacters) &&
            !StringUtilities.containsAny(secondsExpression, ExpressionDescriptor.specialCharacters)) {
            description += this.i18n.atSpace() + this.formatTime(hourExpression, minuteExpression, secondsExpression);
        }
        else if (!secondsExpression &&
            minuteExpression.indexOf("-") > -1 &&
            !(minuteExpression.indexOf(",") > -1) &&
            !(minuteExpression.indexOf("/") > -1) &&
            !StringUtilities.containsAny(hourExpression, ExpressionDescriptor.specialCharacters)) {
            let minuteParts = minuteExpression.split("-");
            description += StringUtilities.format(this.i18n.everyMinuteBetweenX0AndX1(), this.formatTime(hourExpression, minuteParts[0], ""), this.formatTime(hourExpression, minuteParts[1], ""));
        }
        else if (!secondsExpression &&
            hourExpression.indexOf(",") > -1 &&
            hourExpression.indexOf("-") == -1 &&
            hourExpression.indexOf("/") == -1 &&
            !StringUtilities.containsAny(minuteExpression, ExpressionDescriptor.specialCharacters)) {
            let hourParts = hourExpression.split(",");
            description += this.i18n.at();
            for (let i = 0; i < hourParts.length; i++) {
                description += " ";
                description += this.formatTime(hourParts[i], minuteExpression, "");
                if (i < hourParts.length - 2) {
                    description += ",";
                }
                if (i == hourParts.length - 2) {
                    description += this.i18n.spaceAnd();
                }
            }
        }
        else {
            let secondsDescription = this.getSecondsDescription();
            let minutesDescription = this.getMinutesDescription();
            let hoursDescription = this.getHoursDescription();
            description += secondsDescription;
            if (description.length > 0 && minutesDescription.length > 0) {
                description += ", ";
            }
            description += minutesDescription;
            if (description.length > 0 && hoursDescription.length > 0) {
                description += ", ";
            }
            description += hoursDescription;
        }
        return description;
    }
    getSecondsDescription() {
        let description = this.getSegmentDescription(this.expressionParts[0], this.i18n.everySecond(), s => {
            return s;
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Seconds(), s);
        }, s => {
            return this.i18n.secondsX0ThroughX1PastTheMinute();
        }, s => {
            return s == "0"
                ? ""
                : parseInt(s) < 20
                    ? this.i18n.atX0SecondsPastTheMinute()
                    : this.i18n.atX0SecondsPastTheMinuteGt20() || this.i18n.atX0SecondsPastTheMinute();
        });
        return description;
    }
    getMinutesDescription() {
        const secondsExpression = this.expressionParts[0];
        let description = this.getSegmentDescription(this.expressionParts[1], this.i18n.everyMinute(), s => {
            return s;
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Minutes(), s);
        }, s => {
            return this.i18n.minutesX0ThroughX1PastTheHour();
        }, s => {
            try {
                return s == "0" && secondsExpression == ""
                    ? ""
                    : parseInt(s) < 20
                        ? this.i18n.atX0MinutesPastTheHour()
                        : this.i18n.atX0MinutesPastTheHourGt20() || this.i18n.atX0MinutesPastTheHour();
            }
            catch (e) {
                return this.i18n.atX0MinutesPastTheHour();
            }
        });
        return description;
    }
    getHoursDescription() {
        let expression = this.expressionParts[2];
        let description = this.getSegmentDescription(expression, this.i18n.everyHour(), s => {
            return this.formatTime(s, "0", "");
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Hours(), s);
        }, s => {
            return this.i18n.betweenX0AndX1();
        }, s => {
            return this.i18n.atX0();
        });
        return description;
    }
    getDayOfWeekDescription() {
        var daysOfWeekNames = this.i18n.daysOfTheWeek();
        let description = null;
        if (this.expressionParts[5] == "*") {
            description = "";
        }
        else {
            description = this.getSegmentDescription(this.expressionParts[5], this.i18n.commaEveryDay(), s => {
                let exp = s;
                if (s.indexOf("#") > -1) {
                    exp = s.substr(0, s.indexOf("#"));
                }
                else if (s.indexOf("L") > -1) {
                    exp = exp.replace("L", "");
                }
                return daysOfWeekNames[parseInt(exp)];
            }, s => {
                return StringUtilities.format(this.i18n.commaEveryX0DaysOfTheWeek(), s);
            }, s => {
                return this.i18n.commaX0ThroughX1();
            }, s => {
                let format = null;
                if (s.indexOf("#") > -1) {
                    let dayOfWeekOfMonthNumber = s.substring(s.indexOf("#") + 1);
                    let dayOfWeekOfMonthDescription = null;
                    switch (dayOfWeekOfMonthNumber) {
                        case "1":
                            dayOfWeekOfMonthDescription = this.i18n.first();
                            break;
                        case "2":
                            dayOfWeekOfMonthDescription = this.i18n.second();
                            break;
                        case "3":
                            dayOfWeekOfMonthDescription = this.i18n.third();
                            break;
                        case "4":
                            dayOfWeekOfMonthDescription = this.i18n.fourth();
                            break;
                        case "5":
                            dayOfWeekOfMonthDescription = this.i18n.fifth();
                            break;
                    }
                    format = this.i18n.commaOnThe() + dayOfWeekOfMonthDescription + this.i18n.spaceX0OfTheMonth();
                }
                else if (s.indexOf("L") > -1) {
                    format = this.i18n.commaOnTheLastX0OfTheMonth();
                }
                else {
                    const domSpecified = this.expressionParts[3] != "*";
                    format = domSpecified ? this.i18n.commaAndOnX0() : this.i18n.commaOnlyOnX0();
                }
                return format;
            });
        }
        return description;
    }
    getMonthDescription() {
        var monthNames = this.i18n.monthsOfTheYear();
        let description = this.getSegmentDescription(this.expressionParts[4], "", s => {
            return monthNames[parseInt(s) - 1];
        }, s => {
            return StringUtilities.format(this.i18n.commaEveryX0Months(), s);
        }, s => {
            return this.i18n.commaMonthX0ThroughMonthX1() || this.i18n.commaX0ThroughX1();
        }, s => {
            return this.i18n.commaOnlyInX0();
        });
        return description;
    }
    getDayOfMonthDescription() {
        let description = null;
        let expression = this.expressionParts[3];
        switch (expression) {
            case "L":
                description = this.i18n.commaOnTheLastDayOfTheMonth();
                break;
            case "WL":
            case "LW":
                description = this.i18n.commaOnTheLastWeekdayOfTheMonth();
                break;
            default:
                let weekDayNumberMatches = expression.match(/(\d{1,2}W)|(W\d{1,2})/);
                if (weekDayNumberMatches) {
                    let dayNumber = parseInt(weekDayNumberMatches[0].replace("W", ""));
                    let dayString = dayNumber == 1
                        ? this.i18n.firstWeekday()
                        : StringUtilities.format(this.i18n.weekdayNearestDayX0(), dayNumber.toString());
                    description = StringUtilities.format(this.i18n.commaOnTheX0OfTheMonth(), dayString);
                    break;
                }
                else {
                    let lastDayOffSetMatches = expression.match(/L-(\d{1,2})/);
                    if (lastDayOffSetMatches) {
                        let offSetDays = lastDayOffSetMatches[1];
                        description = StringUtilities.format(this.i18n.commaDaysBeforeTheLastDayOfTheMonth(), offSetDays);
                        break;
                    }
                    else {
                        description = this.getSegmentDescription(expression, this.i18n.commaEveryDay(), s => {
                            return s == "L" ? this.i18n.lastDay() : s;
                        }, s => {
                            return s == "1" ? this.i18n.commaEveryDay() : this.i18n.commaEveryX0Days();
                        }, s => {
                            return this.i18n.commaBetweenDayX0AndX1OfTheMonth();
                        }, s => {
                            return this.i18n.commaOnDayX0OfTheMonth();
                        });
                    }
                    break;
                }
        }
        return description;
    }
    getYearDescription() {
        let description = this.getSegmentDescription(this.expressionParts[6], "", s => {
            return /^\d+$/.test(s) ? new Date(parseInt(s), 1).getFullYear().toString() : s;
        }, s => {
            return StringUtilities.format(this.i18n.commaEveryX0Years(), s);
        }, s => {
            return this.i18n.commaYearX0ThroughYearX1() || this.i18n.commaX0ThroughX1();
        }, s => {
            return this.i18n.commaOnlyInX0();
        });
        return description;
    }
    getSegmentDescription(expression, allDescription, getSingleItemDescription, getIntervalDescriptionFormat, getBetweenDescriptionFormat, getDescriptionFormat) {
        let description = null;
        if (!expression) {
            description = "";
        }
        else if (expression === "*") {
            description = allDescription;
        }
        else if (!StringUtilities.containsAny(expression, ["/", "-", ","])) {
            description = StringUtilities.format(getDescriptionFormat(expression), getSingleItemDescription(expression));
        }
        else if (expression.indexOf("/") > -1) {
            let segments = expression.split("/");
            description = StringUtilities.format(getIntervalDescriptionFormat(segments[1]), getSingleItemDescription(segments[1]));
            if (segments[0].indexOf("-") > -1) {
                let betweenSegmentDescription = this.generateBetweenSegmentDescription(segments[0], getBetweenDescriptionFormat, getSingleItemDescription);
                if (betweenSegmentDescription.indexOf(", ") != 0) {
                    description += ", ";
                }
                description += betweenSegmentDescription;
            }
            else if (!StringUtilities.containsAny(segments[0], ["*", ","])) {
                let rangeItemDescription = StringUtilities.format(getDescriptionFormat(segments[0]), getSingleItemDescription(segments[0]));
                rangeItemDescription = rangeItemDescription.replace(", ", "");
                description += StringUtilities.format(this.i18n.commaStartingX0(), rangeItemDescription);
            }
        }
        else if (expression.indexOf(",") > -1) {
            let segments = expression.split(",");
            let descriptionContent = "";
            for (let i = 0; i < segments.length; i++) {
                if (i > 0 && segments.length > 2) {
                    descriptionContent += ",";
                    if (i < segments.length - 1) {
                        descriptionContent += " ";
                    }
                }
                if (i > 0 && segments.length > 1 && (i == segments.length - 1 || segments.length == 2)) {
                    descriptionContent += `${this.i18n.spaceAnd()} `;
                }
                if (segments[i].indexOf("-") > -1) {
                    let betweenSegmentDescription = this.generateBetweenSegmentDescription(segments[i], s => {
                        return this.i18n.commaX0ThroughX1();
                    }, getSingleItemDescription);
                    betweenSegmentDescription = betweenSegmentDescription.replace(", ", "");
                    descriptionContent += betweenSegmentDescription;
                }
                else {
                    descriptionContent += getSingleItemDescription(segments[i]);
                }
            }
            description = StringUtilities.format(getDescriptionFormat(expression), descriptionContent);
        }
        else if (expression.indexOf("-") > -1) {
            description = this.generateBetweenSegmentDescription(expression, getBetweenDescriptionFormat, getSingleItemDescription);
        }
        return description;
    }
    generateBetweenSegmentDescription(betweenExpression, getBetweenDescriptionFormat, getSingleItemDescription) {
        let description = "";
        let betweenSegments = betweenExpression.split("-");
        let betweenSegment1Description = getSingleItemDescription(betweenSegments[0]);
        let betweenSegment2Description = getSingleItemDescription(betweenSegments[1]);
        betweenSegment2Description = betweenSegment2Description.replace(":00", ":59");
        let betweenDescriptionFormat = getBetweenDescriptionFormat(betweenExpression);
        description += StringUtilities.format(betweenDescriptionFormat, betweenSegment1Description, betweenSegment2Description);
        return description;
    }
    formatTime(hourExpression, minuteExpression, secondExpression) {
        let hour = parseInt(hourExpression);
        let period = "";
        if (!this.options.use24HourTimeFormat) {
            period = hour >= 12 ? " PM" : " AM";
            if (hour > 12) {
                hour -= 12;
            }
            if (hour === 0) {
                hour = 12;
            }
        }
        let minute = minuteExpression;
        let second = "";
        if (secondExpression) {
            second = `:${("00" + secondExpression).substring(secondExpression.length)}`;
        }
        return `${("00" + hour.toString()).substring(hour.toString().length)}:${("00" + minute.toString()).substring(minute.toString().length)}${second}${period}`;
    }
    transformVerbosity(description, useVerboseFormat) {
        if (!useVerboseFormat) {
            description = description.replace(new RegExp(this.i18n.commaEveryMinute(), "g"), "");
            description = description.replace(new RegExp(this.i18n.commaEveryHour(), "g"), "");
            description = description.replace(new RegExp(this.i18n.commaEveryDay(), "g"), "");
            description = description.replace(/\, ?$/, "");
        }
        return description;
    }
}
ExpressionDescriptor.locales = {};

class en {
    atX0SecondsPastTheMinuteGt20() {
        return null;
    }
    atX0MinutesPastTheHourGt20() {
        return null;
    }
    commaMonthX0ThroughMonthX1() {
        return null;
    }
    commaYearX0ThroughYearX1() {
        return null;
    }
    use24HourTimeFormatByDefault() {
        return false;
    }
    anErrorOccuredWhenGeneratingTheExpressionD() {
        return "An error occured when generating the expression description.  Check the cron expression syntax.";
    }
    everyMinute() {
        return "every minute";
    }
    everyHour() {
        return "every hour";
    }
    atSpace() {
        return "At ";
    }
    everyMinuteBetweenX0AndX1() {
        return "Every minute between %s and %s";
    }
    at() {
        return "At";
    }
    spaceAnd() {
        return " and";
    }
    everySecond() {
        return "every second";
    }
    everyX0Seconds() {
        return "every %s seconds";
    }
    secondsX0ThroughX1PastTheMinute() {
        return "seconds %s through %s past the minute";
    }
    atX0SecondsPastTheMinute() {
        return "at %s seconds past the minute";
    }
    everyX0Minutes() {
        return "every %s minutes";
    }
    minutesX0ThroughX1PastTheHour() {
        return "minutes %s through %s past the hour";
    }
    atX0MinutesPastTheHour() {
        return "at %s minutes past the hour";
    }
    everyX0Hours() {
        return "every %s hours";
    }
    betweenX0AndX1() {
        return "between %s and %s";
    }
    atX0() {
        return "at %s";
    }
    commaEveryDay() {
        return ", every day";
    }
    commaEveryX0DaysOfTheWeek() {
        return ", every %s days of the week";
    }
    commaX0ThroughX1() {
        return ", %s through %s";
    }
    first() {
        return "first";
    }
    second() {
        return "second";
    }
    third() {
        return "third";
    }
    fourth() {
        return "fourth";
    }
    fifth() {
        return "fifth";
    }
    commaOnThe() {
        return ", on the ";
    }
    spaceX0OfTheMonth() {
        return " %s of the month";
    }
    lastDay() {
        return "the last day";
    }
    commaOnTheLastX0OfTheMonth() {
        return ", on the last %s of the month";
    }
    commaOnlyOnX0() {
        return ", only on %s";
    }
    commaAndOnX0() {
        return ", and on %s";
    }
    commaEveryX0Months() {
        return ", every %s months";
    }
    commaOnlyInX0() {
        return ", only in %s";
    }
    commaOnTheLastDayOfTheMonth() {
        return ", on the last day of the month";
    }
    commaOnTheLastWeekdayOfTheMonth() {
        return ", on the last weekday of the month";
    }
    commaDaysBeforeTheLastDayOfTheMonth() {
        return ", %s days before the last day of the month";
    }
    firstWeekday() {
        return "first weekday";
    }
    weekdayNearestDayX0() {
        return "weekday nearest day %s";
    }
    commaOnTheX0OfTheMonth() {
        return ", on the %s of the month";
    }
    commaEveryX0Days() {
        return ", every %s days";
    }
    commaBetweenDayX0AndX1OfTheMonth() {
        return ", between day %s and %s of the month";
    }
    commaOnDayX0OfTheMonth() {
        return ", on day %s of the month";
    }
    commaEveryMinute() {
        return ", every minute";
    }
    commaEveryHour() {
        return ", every hour";
    }
    commaEveryX0Years() {
        return ", every %s years";
    }
    commaStartingX0() {
        return ", starting %s";
    }
    daysOfTheWeek() {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    }
    monthsOfTheYear() {
        return [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
    }
}

class enLocaleLoader {
    load(availableLocales) {
        availableLocales["en"] = new en();
    }
}

ExpressionDescriptor.initialize(new enLocaleLoader());

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = Object.freeze(["link", "editable", "remainingRuns", "totalRuns", "lastrun"]);
    this.items = [];
  }
  stores() { return { "rules": "items" } };
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("rules", null, options);
  }
  dispose() {
  }
}

const ItemListMixin = {
  data: function () {
    return {
      selectedDate: new Date(),
      timestep: 15,
      timeSteps: [
        5, 10, 15, 20, 30, 45, 60,
      ],
      timeStepRange: [
        { label: '5' },
        { label: '10', isHide: true },
        { label: '15' },
        { label: '20', isHide: true },
        { label: '30' },
        { label: '45', isHide: true },
        { label: '60' },
      ],
      events: [
        {
          eventid: "lala",
          start: new Date(2018, 11, 19, 10, 35),
          end: new Date(2018, 11, 19, 11, 30),
          title: 'Doctor appointment',
          content: '<i class="v-icon material-icons">local_hospital</i>',
          class: 'health'
        },
        {
          eventid: "dudu",
          start: new Date(2018, 11, 21, 10, 35),
          end: new Date(2018, 11, 21, 11, 30),
          fixed: true,
          title: 'Doctor appointment',
          content: '<i class="v-icon material-icons">local_hospital</i>',
          class: 'health'
        },
      ],
    }
  },
  computed: {
  },
  mounted() {
  },
  methods: {
    onEventclick() {
      console.log("CLICK", arguments);
    },
    loadEvents(m) {
      this.$refs.cal.updateMutableEvents(this.events);
    },
    logEvents(t, m) {
      console.log(t, m);
    }
  },
  components: {
    VueCal, VueSlideBar
  },
};

const mixins = [ItemListMixin];

export { mixins, ModelAdapter };
