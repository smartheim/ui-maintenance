<small>You know what an openHAB **Channel** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial.html) reminder.</small>

All available *Thing* channels are presented to you as different cards,
layed out in a grid. 

Generic bindings (or bindings for devices that don't offer
a full auto-discovery experience) also allow to add and remove
channels manually.

A channel has a name, that you can edit by clicking on the name and modify it.

Below the name is a short description of the channel (not editable).

A channel card is either in the configuration view
or in the linking view, as indicated by the active tab button right at the
bottom of the card.

### Configuring a channel

If a channel is not yet configured, it will slightly glow
and pulsate and also start in the configuration view.

Edit the configuration parameters to your will and hit "Save", when
you are done. If all required parameters are filled in, the
channel card will no longer glow and pulsate.

### Linking a channel

As you have already read in the tutorial, a channel is not that
useful on its own. You need to link it to an *Item* which in turn
can be shown on user-interfaces.

The linking view is shown by default and if that channel has all required
configuration. You will see a table of all linked *Items*. You can remove
and add *Links* here, but also setup a profile.
