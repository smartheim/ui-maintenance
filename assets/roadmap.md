# Core Roadmap

This roadmap is based on core developer consensus. 

* Backup service: Configure a local or cloud backup destination and intervals. Allow import/export in yaml/json/xml.
* SSL certificate management service: Add/Remove trusted (D)TLS certificates for peer devices and setup own certificate.

# Paper UI NG Roadmap

Paper UI NG requires some additonal core services and functionality.

## Services

* Script files REST service: Alter files on disk via the REST API.
* Manual Addons managment:
  - List jars including some detailed information like bundle name+version
  - Sha signature display
  - Manual Jar upload
  - Download
  - (De)Activate via the REST API
* Average and longtime resource observe service:
  - Detects thread abuse and memory leaks for long time stability
  - Issues warning notifications
  - REST interface
* OSGI bundles info/start/stop REST interface
* Log provider service that allows to receive the uncut realtime feed via websocket connection
* Platform information provider service: REST endpoints for maintenance page.
  - openHabian: Update/package status, link to openhabian-cli web-service for further configuration.
  - Generic windows/osx/linux: OS version, link to documentation, platform specific quirks

## Core Functionality

* Unify IDs: At the moment we have `name` for *Items*, `UID` for *Things*, `id` for extensions and `uid` for rules.
* Addon management REST interface extension:
  - Extension descriptions as part of the current list response
  - Advanced status report instead of just a boolean "installed" (mimic Thing status)
  - Easily add more maven sources
  - Install a specific version of an Add-on
* Binding extensions:
  - Add version information (available versions)
  - Add "custompages" list. A binding should be able to register own endpoints (under /binding/{binding-id}) and serve own
    html pages. For MQTT an auxilary page could be a "MQTT Traffic Monitor", for ZWave it could be "ZWave Network Diagram".
  - Add "source" link, e.g. "https://github.com/openhab/openhab2-addons/tree/master/addons/binding/org.openhab.binding.network"
  - Add "loglevel" (trace, info, debug, warn, error)
* Notification infrastructure (including PUSH mobile notifications like HabBot)
* Thing Handler actions: For example to have a "Start pairing" or "Firmware reset" action.
  - This includes a simple "web-link" action: Some bindings like the Alexa-Echo one require
    an external OAuth login page for "pairing".
* Services with advanced feedback status (mimic Thing status)
  - New interface to implement for those services (OSGI bundles)
  - Rest endpoint extension to retrieve those extended stati.
* Things REST interface: Unify with addons REST interface. Either remove "configurations" and put it under a
  separate REST endpoint (`thing-uid/config`) or add configurations to the bindings list REST endpoint as well.
* Things/Items/Rules/Scheduled-Tasks need a storage association for the backup service.
* Things/Items/Rules/Scheduled-Tasks need a generic "comment" field for the user to leave notes and annotations.
* Scheduled-Tasks configuration:
  - Rest interface
  - Command an item on timeout (to replace the expire binding more easily)
