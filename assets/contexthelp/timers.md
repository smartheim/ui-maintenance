<small>You know what an openHAB **Timer** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

This section lists all configured timers.
It also lists running timers that are not configured directly by you,
but are dynamically created by *Rules* and *Scripts*.

Add a timer by clicking on "Add timer" to your left in the navigation menu.
Remove a timer by clicking on the trash can icon next to its name.

A timer can have a very simple purpose like a "Weekday wake-up timer".
*Rules* and *Scripts* can create timers dynamically for example to
"switch off a lamp, 5 minutes after it has been switched on".

### Timers have a unique ID

Timers need to be identified uniquely within openHAB. Therefore they have a timer ID.
You can retrieve a timer in *Rules* and *Scripts* by referencing it by its ID.

You can also clone a timer (the timer ID will change).

### Tags

Tags can be assigned to timers. You can not only filter this list by tags, but you
can also retrieve all timers of a given Tag in *Rules* and *Scripts*.

### Show timers in apps

The Android and iOS App as well as HabPanel will only show timers that have the "Expose" checkbox ticked.
Other timers are considered "private" timers.