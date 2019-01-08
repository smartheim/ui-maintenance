<small>You know what an openHAB **Item** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Find all your configured *Items* listed here.

You can manually add a new *Item*, if you click on "Add Item" to your left.

## Textual mode

For batch editing, filter your list first and then click on the "text view mode" icon
for a textual representation.

* Use copy &amp; paste,
* regex find &amp; replace,

to batch edit your *Items*. Hit **Save** when you are done.

Each textual represented *Item* will be applied to openHAB in order.
Syntax errors and conflicts are reported for errornous lines,
but non-affected *Items* are still applied.

<mark>Please note</mark>: The textual mode is powerful.
If you clear the entire text field and hit save:
Everything is gone. Act responsible in this mode!

## Backup

Your *Items* are automatically backup'd by openHAB. But you can also 
grab a manual copy when you click on "Export Items to files" in the left navigation menu.

Click "Import Items from files" to import again. Current *Items* with the
same "Item ID" are overwritten, but Items will never be removed.

The import/export path is configured in the [Maintenance](maintenance.html) section.