> You know what an openHAB **Thing** is, right? If not, please first go through the tutorial.

Especially new devices and services have means to perform a discovery on them.
openHAB will ask all its installed [bindings](addons.html) for discovered *Things*.

Some bindings can't perform a discovery all the time, like the Network binding
for example. Click on the "Start discovery now" link to your left to kindly ask
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
