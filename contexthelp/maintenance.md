Your openHAB installation requires a bit of maintenance from
time to time. This is also the screen to perform system-wide
configuration and to configure core services as well as
additional services, installed via the [Add-ons](addons.html)
section.

A new version of openHAB is released about every half
a year. You do **not** need to upgrade if everything
works for you.

### Logging

openHAB logs very verbosely every item change and event,
as well as core and binding failures or abnormal state.

Find the "Show log" link in the left navigation menu and
have a look.

### Long time stability

openHAB periodically takes a snapshot of its memory and
processor usage. If that only increases over time,
that is an indication for a resource leak in one of the
installed [Add-ons](addons.html).

The "Long time stability" service provides you
time graphs for the used memory, CPU and number of
<abbr title="A thread is one running task of your openHAB installation. Too many indicate a resource leak.">Threads</abbr>.

In the left navigation menu, click on "Long time stability service"
to configure the treshold values and if a warning
notification should be send on abnormal resource usage.

### The cache

openHAB need to cache a few things while running.
Sometimes that cache goes out of sync (usually on updates,
on crashes or on a currupted file system).

Clear the cache by clicking on "Clear cache and restart".
openHAB need to recreate the cache. The starting up time
could increase a bit.