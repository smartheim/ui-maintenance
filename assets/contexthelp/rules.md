<small>You know what an openHAB **Rule** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

See your current rules in this list. 
Create a new rule by clicking on "Add new Rule" to your left in the navigation menu.

## More actions/triggers

Certain [Add-ons](addons.html) add more actions and triggers to the table.

## Scripts

This list does not contain *Scripts*.
With *Rules*, *Profiles* and *Transformations* you can handle about 98% of your automation needs.
For very advanced and complex scenarios you might need to fallback
to a *Script* instead.

A script is a small program written in **JavaScript** or **Python**
dialect and is way more powerful:

* You can build up on external libraries,
* and interact freely with the operating system (files, network, etc).

<mark>Downside</mark>: A script need to be parsed by openHAB, which
consumes more memory and processing power than *Rules*. Messing with
the operating system can also lead to leaking resources, like open
file handlers, timer handlers, open network sockets.

Create a new Script by clicking on "Create new Script" to your left
in the navigation menu.

All your currently existing scripts are listed in that menu as well.

## Textual mode

Filter your list to only show wanted *Rules* &rarr; click on the "text view mode" icon.
Batch edit your *Rules* in a textual representation while using

* copy &amp; paste and
* regex find &amp; replace.

<mark>Save</mark>: Each textual represented *Rule* will
be applied to openHAB in order of appearence.
Removed *Rule* lines result in removed *Rules*.
Syntax errors and conflicts are reported per line,
but do not affect other *Rules* in the same document.

<mark>Please note</mark>: The textual mode is powerful.
If you clear the entire text field and hit save:
Everything is gone. Act responsible!

## Backup

Your *Rules* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Rules to files" in the left navigation menu.

Click "Import Rules from files" to import again:

1. Current *Rules* with the same "Rule ID" are overwritten
2. An import file cannot remove *Rules*.

The import/export path is configured in the [Maintenance](maintenance.html) section.
