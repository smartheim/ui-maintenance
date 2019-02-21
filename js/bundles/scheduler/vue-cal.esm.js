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

      this.$parent.dragPosition = e.offsetY;
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
            (el.__vue__.dragPosition * this.timeStep) / this.timeCellHeight;
          el.__vue__.dragEnd(
            Math.floor((m + this.timeFrom) / 60),
            Math.floor(m + this.timeFrom) % 60
          );
          break;
        }
      }
      this.domEvents.dragging = false;
      this.$parent.dragPosition = null;
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
      style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
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
var __vue_render__ = function() {
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
      _vm._l(_vm.splits.length || 1, function(i) {
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
                    function(event, j) {
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
                            mouseenter: function($event) {
                              _vm.onMouseEnter($event, event);
                            },
                            mouseleave: function($event) {
                              _vm.onMouseLeave($event, event);
                            },
                            mousedown: function($event) {
                              _vm.onMouseDown($event, event);
                            },
                            dragstart: function($event) {
                              _vm.onDragStart($event, event);
                            },
                            dragend: function($event) {
                              _vm.onDragEnd($event, event);
                            },
                            contextmenu: function($event) {
                              _vm.onContextMenu($event, event);
                            },
                            touchstart: function($event) {
                              _vm.onTouchStart($event, event);
                            },
                            click: function($event) {
                              _vm.onClick($event, event);
                            },
                            dblclick: function($event) {
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
                                    mousedown: function($event) {
                                      $event.stopPropagation();
                                      $event.preventDefault();
                                      _vm.deleteEvent(event);
                                    },
                                    touchstart: function($event) {
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
                                  mousedown: function($event) {
                                    _vm.editableEvents &&
                                      _vm.time &&
                                      _vm.onDragHandleMouseDown($event, event);
                                  },
                                  touchstart: function($event) {
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
      _vm.$parent.dragPosition != null &&
      _vm.$parent.dragCurrentCell == _vm.cellid
        ? _c("div", {
            key: "dragline",
            staticClass: "vuecal__drag-line",
            style: "top: " + _vm.$parent.dragPosition + "px"
          })
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

var script$1 = {
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
      default: () => {}
    },
    onEventDblclick: {
      type: Function,
      default: () => {}
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

    dragPosition: null,
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

    onDragOver(e, cell, cellid) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (e.offsetY == -1) {
        console.trace();
        return;
      }
      this.dragPosition = e.offsetY;
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
    if (this.selectedDate) {
      this.updateSelectedDate(this.selectedDate);
    } else {
      this.view.selectedDate = this.now;
      this.switchView(this.defaultView);
    }

    this.ready = true;
    window.requestAnimationFrame(() => {
      const nowLine = document.querySelector(".vuecal__now-line");
      if (nowLine) nowLine.scrollIntoView();
    });
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
    selectedDate: function(date) {
      this.updateSelectedDate(date);
    }
  }
};

/* script */
const __vue_script__$1 = script$1;
/* template */
var __vue_render__$1 = function() {
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
                  _vm._l(_vm.views, function(v, id) {
                    return v.enabled
                      ? _c(
                          "li",
                          {
                            class: { active: _vm.view.id === id },
                            on: {
                              click: function($event) {
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
                              click: function($event) {
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
                  _vm._l(_vm.viewHeadings, function(heading, i) {
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
                                _vm._l(3, function(j) {
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
                    _vm._l(_vm.viewCells, function(cell, i) {
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
                            dragover: function($event) {
                              $event.target.dataset.id &&
                                _vm.onDragOver($event, cell, i);
                            },
                            dragenter: function($event) {
                              _vm.onDragEnter($event);
                            },
                            drop: function($event) {
                              $event.preventDefault();
                            },
                            click: function($event) {
                              _vm.selectCell(cell);
                            },
                            dblclick: function($event) {
                              _vm.dblClickToNavigate &&
                                _vm.switchToNarrowerView();
                            }
                          },
                          scopedSlots: _vm._u([
                            {
                              key: "event-renderer",
                              fn: function(ref) {
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
                                                blur: function($event) {
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
                                    _vm._l(_vm.timeCells, function(cell, i) {
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
                                        _vm._l(_vm.viewHeadings, function(
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
                                                      _vm._l(3, function(j) {
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
                                    _vm._l(_vm.viewCells, function(cell, i) {
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
                                            dragover: function($event) {
                                              $event.target.dataset.id &&
                                                _vm.onDragOver($event, cell, i);
                                            },
                                            dragenter: function($event) {
                                              _vm.onDragEnter($event);
                                            },
                                            drop: function($event) {
                                              $event.preventDefault();
                                            },
                                            click: function($event) {
                                              _vm.selectCell(cell);
                                            },
                                            dblclick: function($event) {
                                              _vm.dblClickToNavigate &&
                                                _vm.switchToNarrowerView();
                                            }
                                          },
                                          scopedSlots: _vm._u([
                                            {
                                              key: "events-count-month-view",
                                              fn: function(ref) {
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
                                              fn: function(ref) {
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
                                                                blur: function(
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
  function() {
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

export default index;
