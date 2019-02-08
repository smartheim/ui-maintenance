*Items* can be assigned to groups. A group is just another *Item* that is of type "Group".
A group can have a state on its own (On, Off, Open, Closed), but only if it is of any type
like for example a Switch type or Number type.

Group Items can derive their own state from their member Items. To derive a state the Group Item must be constructed using a base Item type and a Group function. When calculating the state, Group functions recursively traverse the Group's members and also take members of subgroups into account. If a subgroup however defines a state on its own (having base Item & Group function set) traversal stops and the state of the subgroup member is taken.

Group functions may take arguments.

For example the function "All state S1 ⊶ S1" takes two arguments (two states).
If the first argument is ON and the second OFF,
the group will appear as ON if all of its switch-based members are ON otherwise it will be OFF.

See also the [Documentation on Items](https://www.openhab.org/docs/concepts/items.html#derive-group-state-from-member-items).