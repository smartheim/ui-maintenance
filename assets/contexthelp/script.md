<small>You know what an openHAB **Script** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

With *Rules*, *Profiles* and *Transformations* you can handle about 98% of your automation needs.
Very advanced, unusual or complex scenarios might require a scripted solution though.

A script is a small program written in **JavaScript** (`.js`-files) or **Python** (`.py`-files)
dialect and is way more powerful:

* You can build up on external libraries,
* and interact freely with the operating system (files, network, etc).

<mark>Downside</mark>: A script need to be parsed by openHAB, which
consumes more memory and processing power than *Rules*. Messing with
the operating system can also lead to leaking resources, like open
file handlers, timer handlers, open network sockets.

Links:
* [openhab: Scripting](https://www.openhab.org/docs/configuration/jsr223.html#trigger-types-all-jsr223-languages)
* [Simplify scripts with a helper library](https://github.com/lewie/openhab2-javascript#openhab-2x-jsr223-javascript-code-since-24)

Click on the following links to <mark>replace</mark> your current
editor content with an example snippet.

Example scripts:
<oh-script-snippets target="editorwindow"></oh-script-snippets>