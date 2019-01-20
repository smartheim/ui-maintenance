<small>You know what an openHAB **Rule** and **Script** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

See your current rules and scripts in this list. 

Click the *Rules* name to show or modify the storage association (e.g. filename),
see the <abbr title="The ID is used by Rules and Scripts">unique ID</abbr>, and change
the icon category.

### Rules vs Scripts

With *Rules*, *Profiles* and *Transformations* you can handle about 98% of your automation needs.
Very advanced, unusual or complex scenarios might require a scripted solution though.
A *Script* is more powerful, but also harder to edit, maintain and process for openHAB.

## Textual mode

Batch edit your data while using copy &amp; paste, regex find &amp; replace syntax highlighting, and auto-suggestions.

<p>
<details>
<summary>The format is <a target="_blank" href="https://en.wikipedia.org/wiki/YAML">YAML</a>.</summary>
Synopsis:

* Whitespace indentation denotes the structure.
* Comments begin with the number sign (#).
* List members are denoted by a leading hyphen (-) with one member per line.
* Express associative data in the form "key: value".
</details>
</p>

<mark>Please note</mark>: The textual mode is powerful.
Hit save with an emptied text field and everything is gone. Act responsible!

## Storage

openHAB internally stores your data a little different than what you see 
here in the textual mode representation. The [backup service](maintenance.html) however
will create files that match this format and imports same-like files again.

Change the storage association to store the data item into a different
file.
