# What is working / missing?

Paper UI NG requires some additonal core services and functionality.

How to read this page? You will see a table upfront of each page section.
In this table you will find the missing User-Interface parts. Below that
table you will find a bullet point list of missing services or functionality
in openHAB core.

## General core improvements

* Unify IDs: At the moment we have `name` for *Items*, `UID` for *Things*, `id` for extensions and `uid` for rules.
* Notification infrastructure
* Services with advanced feedback status (mimic Thing status)
  - New interface to implement for those services (OSGI bundles)
  - Rest endpoint extension to retrieve those extended stati.
* Things/Items/Rules/Scheduled-Tasks
  - Storage association+position for the backup service.
  - Generic "comment"/"annotation" field for the user to leave notes and annotations.
* Item handling requires a lot of knowdledge in clients. Allow static data fetches via more REST endpoints for
  - "item-types"
  - "item-group-functions" (AND, OR, AVG etc)

## Maintenance page

|  | Working? | Comments |
|---|----------|----------|
| Service configuration | ✓ | Extended service status is emulated |
| Persistence configuration | – | |
| OSGI Bundle status | – | |
| Backup service status | – | |
| Long time stability service | – | |
| Log view | – | |
| Platform and core version info | – | |

* Backup service: Configure a local or cloud backup destination and intervals. Allow import/export in yaml/json/xml.
* SSL certificate management service: Add/Remove trusted (D)TLS certificates for peer devices and setup own certificate.
* CORS service needs interface configuration description file
* Average and longtime resource observe service:
  - Detects thread abuse and memory leaks for long time stability
  - Issues warning notifications
  - REST interface
* OSGI bundles info/start/stop REST interface
* Log provider service that allows to receive the uncut realtime feed via websocket connection
* Platform information provider service: REST endpoints for maintenance page.
  - openHabian: Update/package status, link to openhabian-cli web-service for further configuration.
  - Generic windows/osx/linux: OS version, link to documentation, platform specific quirks
* Persistence REST interface extensions:
  - Change from a simple id list to objects with id, label, description, run-status etc
  - Allow to configure a persistence service (using configuration-refs like Things and Services do).

## Add-ons page

|  | Working? | Comments |
|---|----------|----------|
| Install addons | ✓ | Extended feedback while installing is emulated |
| Uninstall addons | ✓ | |
| Jar addon install | – | |
| Version change | – | |
| Repository management | – | |
| Custom pages support | ✓ | |

* Manual Addons managment:
  - List jars including some detailed information like bundle name+version
  - Sha signature display
  - Manual Jar upload
  - Download
  - (De)Activate via the REST API
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

## Inbox page

|  | Working? | Comments |
|---|----------|----------|
| List discoveries | ✓ |  |
| Approve discoveries | – |  |
| Hide discoveries | – |  |
| Enable/Disable background dis. | – |  |
| List bindings with bg dis. | – |  |

* Discovery REST:
  - Allow a binding discovery process to be stopped
  - Request all bindings that have background discovery enabled
  - Enable/disable background discovery for individual bindings

## Things page

|  | Working? | Comments |
|---|----------|----------|
| List things | ✓ |  |
| Add things | – |  |
| Edit things | – |  |
| Remove things | – |  |
| Thing actions | – |  |

* Thing Handler actions: For example to have a "Start pairing" or "Firmware reset" action.
  - This includes a simple "web-link" action: Some bindings like the Alexa-Echo one require
    an external OAuth login page for "pairing".

* Things REST interface: Unify with addons REST interface. Either remove "configurations" and put it under a
  separate REST endpoint (`thing-uid/config`) or add configurations to the bindings list REST endpoint as well.

## Items page

|  | Working? | Comments |
|---|----------|----------|
| List Items | ✓ |  |
| Create/Edit/Remove Items | ✓ |  |
| Item Meta-info | – |  |
| Group Items | – |  |

## Scheduler page

|  | Working? | Comments |
|---|----------|----------|
| List tasks | ✓ | |
| Add/Remove/edit tasks | – | |

* Scheduled-Tasks configuration:
  - Rest interface
  - Command an item on timeout (to replace the expire binding more easily)
  - Provide better modules for Rules

## Rules page

|  | Working? | Comments |
|---|----------|----------|
| List rules | ✓ | |
| Create/Edit/Remove rules | ✓ |  |
| List standalone scripts | ✓ | |
| Create/Edit/Remove scripts | – |  |

* Rule templates require some more information to be used as distribution format:
  - Authors
  - Required bindings
  - Version

* Script files REST service: Alter files on disk via the REST API.
