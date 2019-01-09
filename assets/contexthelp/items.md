<small>You know what an openHAB **Item** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Find all your configured *Items* listed here.

You can manually add a new *Item*, if you click on "Add Item" to your left.

## Textual mode

Filter your list to only show wanted *Items* &rarr; click on the "text view mode" icon.
Batch edit your *Items* in a textual representation while using

* copy &amp; paste and
* regex find &amp; replace.

<mark>Save</mark>: Each textual represented *Item* will
be applied to openHAB in order of appearence.
Removed *Item* lines result in removed *Items*.
Syntax errors and conflicts are reported per line,
but do not affect other *Items* in the same document.

<mark>Please note</mark>: The textual mode is powerful.
If you clear the entire text field and hit save:
Everything is gone. Act responsible!

## Backup

Your *Items* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Items to files" in the left navigation menu.

Click "Import Items from files" to import again:

1. Current *Items* with the same "Item ID" are overwritten
2. An import file cannot remove *Items*.

The import/export path is configured in the [Maintenance](maintenance.html) section.
