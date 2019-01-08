<small>You know what an openHAB **Thing** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Find all your configured *Things* listed here.

You can manually add new *Things*, if you click on "Add Thing* to your left.
A manual *Thing* requires configuration.
Most of the time, you want to embrace ready configured *Things* from the discovery
[Inbox](inbox.html) though.

## Textual mode

For batch editing, filter your list first and then click on the "text view mode" icon
for a textual representation.

* Use copy &amp; paste,
* regex find &amp; replace,

to batch edit your *Items*. Hit **Save** when you are done.

Each textual represented *Thing* will be applied to openHAB in order.
Syntax errors and conflicts are reported for errornous lines,
but non-affected *Things* are still applied.

<mark>Please note</mark>: The textual mode is powerful.
If you clear the entire text field and hit save:
Everything is gone. Act responsible in this mode!

## Backup

Your *Things* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Things to files" in the left navigation menu.

Click "Import Things from files" to import again. Current *Things* with the
same "Thing ID" are overwritten, but Things will never be removed.

The import/export path is configured in the [Maintenance](maintenance.html) section.