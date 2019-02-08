<small>You know what an openHAB **Item** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Find all your configured *Items* listed here.

## Icons

An *Item* can have an icon assigned that is used for presentation in some user interfaces.
For all available icons have a look at
[the classic icon theme](https://www.openhab.org/docs/configuration/iconsets/classic/).

## Groups

*Items* can be assigned to groups. A group is just another *Item* that is of type "Group".
A group can have a state on its own (On, Off, Open, Closed), but only if it is of any type
like for example a Switch type or Number type.

The groups state depends on the selected group-state-function.
For example a group can appear as ON if any of its switch-based members are one.

## Filter

Filter items by tags, types or groups. Examples:
* `groupNames`:`AwesomeGroup`
* `tags`:`Lighting`
* `type`:`Switch`

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
