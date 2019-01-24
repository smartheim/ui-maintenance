Add / edit your timed-task in this screen.

### Timed-tasks have a unique ID

openHAB stores *Timed-tasks* by their unique ID.
You can retrieve a *Timed-task* in *Rules* and *Scripts* by referencing it by its ID.

### Tags

Tags can be assigned to *Timed-tasks*.
You can retrieve all *Timed-tasks* of a given Tag within *Rules* and *Scripts*.

### Show Timed-tasks in apps

The Android and iOS App as well as HabPanel will only show *Timed-tasks* that have the "Expose" checkbox ticked.
Others are considered *private*.

All dynamically created *Timed-tasks* are *private* by default.

### Delete after triggered

Removes the *Timed-task* after it has triggered.
Most useful for dynamically created ones.

### Enabled

A disabled *Timed-task* will not trigger.
An absolute *Timed-task*, that has triggered will disable itself.

<mark>Use-case:</mark> Create *Timed-tasks* here in this interface, but enable/disable them in Rules for example.

### Trigger item command

You can also issue an item command directly instead of just triggering.
A *Timed-task* that triggers is usually only useful for Rules and Scripts.

### Trigger at an absolute date/time

Instead of triggering at recurring times, an absolute date/time is used.
