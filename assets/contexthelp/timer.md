Add / edit your timer in this screen.

### Timers have a unique ID

Timers need to be identified uniquely within openHAB. Therefore they have a timer ID.
You can retrieve a timer in *Rules* and *Scripts* by referencing it by its ID.

You can also clone a timer (the timer ID will change).

### Tags

Tags can be assigned to timers. You can retrieve all timers of a given Tag in *Rules* and *Scripts*.

### Show timers in apps

The Android and iOS App as well as HabPanel will only show timers that have the "Expose" checkbox ticked.

Other timers are considered *private* timers.
All dynamically created timers timers are *private* by default.

### Delete after triggered

Removes the timer after it has triggered.
Most useful for dynamically created timers

### Enabled

A disabled timer will not trigger. An absolute timer, that has triggered will disable itself.

<mark>Use-case:</mark> Create timers here in this interface, but enable/disable them in Rules for example.

### Trigger item command

You can also issue an item command directly instead of just triggering.
A timer that triggers is usually only useful for Rules and Scripts.

### Trigger at an absolute date/time

Instead of triggering at recurring times, an absolute date/time is used.
