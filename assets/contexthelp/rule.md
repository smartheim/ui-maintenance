<small>You know what an openHAB **Rule** and **Script** is, right?</small>
<small class="blockquote-footer">Your friendly [tutorial](tutorial-1.html) reminder.</small>

In the middle part of the screen you see the graphical rule editor.

To make you more space to edit your rule, you can collapse the name, description and UID section.

To your very left there is a list of available rule components.
There are three different types of components. For easy navigation
they are color coded:

<ul>
<li style="background-color: #d8f6df;padding:5px"><b>Trigger</b>: Defines the events when the Rule will trigger. This is optional if you are creating a Rule that is to be called from other Rules. You can create more than one trigger.
<li style="background-color: #f4c37d;padding:5px"><b>Condition</b>: Defines the conditions under which the Rule will run when triggered. This is optional and there can be more than one condition.
<li style="background-color: #f3b7bd;padding:5px"><b>Action</b>: Defines what actions the Rule takes when it runs. This is optional (though the Rule won’t do anything) and there can be more than one Action. Actions are performed in the order they are connected.
</ul>

Just drag&drop the component from the list onto the grid pattern.
To remove a component, click the trash icon in the top-right of that component.


## More actions/triggers

Certain [Add-ons](addons.html) add more actions and triggers to the table.

## Use the filter

Just type in your search term and while you type the component list reduces to found results.
You can also use special search patterns like "type:trigger", "type:condition" or "type:action"
to filter for the respective component type.

## Component configuration

Usually a component requires configuration. A specific time trigger component for example
requires you to enter the actual date/time. Click on the respective input field and edit the
value. Some configurations cannot be performed inline. Click on the *Edit* button instead.

## Connect components

Components can have *Inputs* and *Outputs*.
If you hover over an *Input*/*Output* you will see its type.
You can only connect *In/Outputs* of the same type.

<mark>Note:</mark> You can connect an *Output* to as as many *Inputs* as you want.

<hr>

<u>Example</u>: You are using the **a trigger channel fired** component to trigger a rule.
You want the rule to perform its actions only if the channel name contains "test". 
Therefore you connect the output `channelname` to the **contains text** condition component.
You enter the text "test" into the configuration field of that component.