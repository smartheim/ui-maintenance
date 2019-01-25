<small>You know what an openHAB **Timed-Task** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

This section lists all configured timed-tasks.
It also lists scheduled tasks that are not configured directly by you,
but are dynamically created by *Rules* and *Scripts* or *Bindings*.

A *Timed-Task* can have a very simple purpose like a "Weekday wake-up timer".
*Rules* and *Scripts* can create *Timed-Tasks* dynamically for example to
"switch off a lamp, 5 minutes after it has been switched on".

## Filter

Filter items by tags or types. Examples:
* `tags`:`Wakeup`
* `type`:`cron` or `type`:`fixed`

## Show timers in apps

The Android and iOS App as well as HabPanel will only show *Timed-Task* that are exposed.

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

<details>
<summary>Storage</summary>

openHAB internally stores your data a little different than what you see 
here in the textual mode representation. The [backup service](maintenance.html) however
will create files that match this format and imports same-like files again.

Change the storage association to store the data item into a different
file.
</details>