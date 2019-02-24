# The storage webworker (Model)

A Model-View-Adapter (MVA) concept is in place and illustrated in
the following diagram:

![Model-View-Adapter](../docs/paperui-ng-dataflow.svg "Model-View-Adapter Architecture")

[Image source](https://drive.google.com/file/d/1lqg5GJHdkVk5PlnCgbheggQ7MSwSDHfj/view?usp=sharing)

There are several components used as **View**:
* The `VueJS` based `ohcomponents/oh-vue-list` for reactive list
* The `uicomponents/ui-dropdown` for a dropdown (e.g. selection of *Items* or *Profiles*)
* The `VueJS` based `ohcomponents/oh-vue` for configuration pages

The `ohcomponents/oh-vue-list-bind` and `ohcomponents/oh-vue-bind` classes serve as **Controllers**.
They receive all *remove* and *change* requests of the *Views* and also observe the *Model*
and *Adapter* for any changes.

The `modeladapter_lists/*` classes provide Mixins for the *View*, but also provide
Model **Adapters** that communicate with the *Model* (aka Store).
