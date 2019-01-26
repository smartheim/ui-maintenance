Items and Channels are linked together via openHAB *Links*.

A *Link* without any further options will just pass new *Channel*
values to the linked *Item* and pass commands towards an *Item*
to the *Channel*.

You can influence this behaviour via *Profiles*.
Some profiles are part of openHAB, but *Add-ons*
might add more as well.

The following *Profiles* are part of openHAB:

* **Default**: Only passing as describe above
* **Follow**: The *Link* will also pass *Item* state
  updates to the connected *Channel*. You usually want
  that to synchronize two or more different *Binding* *Channels*.