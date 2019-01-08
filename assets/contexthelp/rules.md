See your current rules in this list. 

Rules allow you to perform a series of actions,
if certain conditions are fulfilled. Rules are
triggered by events like a timer timeout or an item changed.

Certain [Add-ons](addons.html) add more actions and triggers to the table.

Create a new rule by clicking on "Add new Rule" to your left in the navigation menu.

## Scripts

This list only contains Trigger->Condition->Action *Rules*, but no
scripts. With *Rules* you can do about 90% of your automation needs.
For very advanced and complex scenarios you might need to fallback
to a script instead.

A script is a small program written in **JavaScript** or **Python**
dialect and is way more powerful, because

* you can build up on external libraries,
* and interact freely with the operating system (files, network, etc).

_Downside_: A script need to be parsed by openHAB, which
consumes more memory and processing power than *Rules*. Messing with
the operating system can also lead to leaking resources, like open
file handlers, timer handlers, open network sockets.

Create a new Script by clicking on "Create new Script" to your left
in the navigation menu.

All your currently existing scripts are listed in that menu as well.

## Textual mode

For batch editing, filter your list first and then click on the "text view mode" icon
for a textual representation.

* Use copy &amp; paste,
* regex find &amp; replace,

to batch edit your *Items*. Hit **Save** when you are done.

Each textual represented *Rule* will be applied to openHAB in order.
Syntax errors and conflicts are reported for errornous lines,
but non-affected *Rules* are still applied.

__Please note__: If you remove a *Rule*, or multiple, or all in the textual mode:
They will be removed and are gone. Act responsible in this mode!

## Backup

Your *Rules* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Rules to files" in the left navigation menu.

Click "Import Rules from files" to import again. Current *Rules* with the
same "Rule ID" are overwritten, but Rules will never be removed.

The import/export path is configured in the [Maintenance](maintenance.html) section.
