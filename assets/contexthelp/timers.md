A timer in openHAB is an object that triggers on a specific point in time
or on a reoccuring schedule of future points in time.

This section lists all configured timers.
It also lists running timers that are not configured directly by you,
but are dynamically created by rules and scripts.

You can remove and manipulate all listed timers. Add a timer, by
clicking on "Add timer" to your left in the navigation menu.

A timer can have a very simple purpose like a "Weekday wake-up timer".
It can also being created dynamically by a rule for "switching off a lamp, 5 minutes
after it has been switched on".

## Timers have a unique ID and optionally tags

Timers need to be identified uniquely by openHAB. Therefore they have a timer ID.
You can retrieve a timer instance by referencing it by its ID.

Tags can be assigned to timers. You can not only filter this list by tags, but you
can also retrieve all timers of a given Tag: For example all "Wake-up" timers.

## Expose timers to Apps and HabPanel

Apps and HabPanel will only show timers that have the "Expose" checkbox ticked.
Other timers are considered "private" timers.