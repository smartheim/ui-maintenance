<small>You know what an openHAB **Thing** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Find all your configured *Things* listed here.

You can manually add new *Things*, if you click on "Add Thing* to your left.
A manual *Thing* requires configuration.
Most of the time, you want to embrace ready configured *Things* from the discovery
[Inbox](inbox.html) though.

## Textual mode

Filter your list to only show wanted *Things* &rarr; click on the "text view mode" icon.
Batch edit your *Things* in a textual representation while using

* copy &amp; paste and
* regex find &amp; replace.

<mark>Save</mark>: Each textual represented *Thing* will
be applied to openHAB in order of appearence.
Removed *Thing* lines result in removed *Things*.
Syntax errors and conflicts are reported per line,
but do not affect other *Things* in the same document.

<mark>Please note</mark>: The textual mode is powerful.
If you clear the entire text field and hit save:
Everything is gone. Act responsible!

## Backup

Your *Things* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Things to files" in the left navigation menu.

Click "Import Things from files" to import again:

1. Current *Things* with the same "Thing ID" are overwritten
2. An import file cannot remove *Things*.

The import/export path is configured in the [Maintenance](maintenance.html) section.