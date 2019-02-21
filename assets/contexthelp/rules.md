<small>You know what an openHAB **Rule** and **Script** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial.html) reminder.</small>

See your current rules in this list. 

### Rules vs Standalone Scripts

With *Rules*, *Profiles* and *Transformations* you can handle about 98% of your automation needs.
Very advanced, unusual or complex scenarios might require a scripted solution though.
A [*Script*](scripts.html) is more powerful, but also harder to edit, maintain and process for openHAB.

## Textual mode

Batch edit your data while using copy &amp; paste, regex find &amp; replace syntax highlighting, and auto-suggestions.

Be aware that rules can contain javascript code parts.
Those are heavily [escaped](https://en.wikipedia.org/wiki/Escape_character).
Please do not edit those lines without excatly knowing what you are doing.

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
