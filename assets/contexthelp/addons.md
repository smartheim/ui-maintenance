In this section you extend the functionality of openHAB.

Add-ons allow openHAB to recognise devices, to extend what
you can do in Rules and Scripts, and to make openHAB
available to other services like Amazon Alexa, Google Home,
Apple HomeKit and so on.

You can install add-ons from:

* the official repository
* from the Eclipse Marketplace,
* directly from the repository of a developer, via a `.jar` file.

## Terminology

An add-on that ...

* integrates physical hardware, external systems and web services is called: **Binding**,
* exposes openHAB to external systems is called: **System integration**,
* stores time series data for history-based actions or statistics is called: **Persistence service**,
* translates between technical and human-readable values for Items is called: **Transformation**,
* provides voice enabling features, such as text-to-speech, speech-to-text is called: **Voice service**.

Please use those names in the community forum to avoid confusion.

## Maintenance status

Each binding has a maintenance status:

* **Stable**: A stable add-on is maintained by openHAB developers and installed from the official repository. Add-ons in this category are adapted to breaking changes in openHAB.
* **Snapshot**: A snapshot add-on is maintained by openHAB developers and installed from the official snapshot repository. It is not guaranteed that it works with your current openHAB version, if openHAB is not also a snapshot version. A snapshot Add-on has all the latest fixes, but might also contain breaking changes.
* **Unmaintained**: An unmainted add-on did not receive an update (yet) for your current openHAB version. That usually happens with manually installed `.jar` files at some point.
* **Beta**: If you have installed an add-on from the marketplace or directly from a developer, and the version is higher than the current openHAB version, it has this status.

## Updates

New [Add-ons](addons.html) usually require a new runtime version.
If you want to gain access to those, you need to keep your openHAB version
up-to-date. If you need a fix for a specific add-on, you can also
be adventurous and change the version to "Snapshot".

> A snapshot version contains the latest fixes but might also break at any time.
