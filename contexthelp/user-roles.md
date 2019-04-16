You can define user-roles.

A user can have specific access rights to openHAB subsystems
like persistence, configurations, inbox, things and so on.

You can also allow a user to just access "items" and then define
which items are accessible via a selection of specific items
and by regex patterns on the label and the ID. Items can also
be allowed by their Tags.

### Regex

Some example patterns for using regular expressions (regex) to
match items:

* item1 or item2: `item1`|`item2`
* All items: `.*`
* All items starting with "kitchen": `kitchen*`
* All items containing "room": `.*room.*`
