<small>You know what an openHAB **Thing** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

Newer devices and services have means to perform discovery.
openHAB performs an automatic discovery in the background for
all its installed [bindings](addons.html).

Some bindings can't perform a discovery all the time, like the Network binding
for example. Click on the "Start full discovery" action to your left to kindly ask
those bindings right now.

Some bindings can't perform a discovery at all. Reasons can be that devices
are too old or use ancient interfaces (Serial communication port) or are too
generic like the HTTP and MQTT binding.

Go to the [Things](things.html) page for manually adding *Things*, that don't appear here.

## Troubleshooting

If a binding promises auto-discovery in its documentation, but nothing appears
here, that is probably a bug. Please follow the binding documentation to the word,
and also look for troubleshoot sections.

If you haven't found a solution, please don't refrain from asking in our
helpful [community](https://community.openhab.org). Resolve this even faster,
by creating a bug report, so that developers can see and reproduce the problem.
