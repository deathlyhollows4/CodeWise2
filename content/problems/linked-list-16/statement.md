## Delete whole repeated runs

The native input list is nondecreasing. Keep a node only when its value occurs exactly once in the entire list. If a value is repeated, remove every node in that run; do not keep one representative. Preserve the order, identity, and values of the retained nodes.

## Native function

`solve(head)` receives ListNode or null and returns the retained native head or null. Nodes expose val and next. You may relink next pointers. Do not create replacement answer nodes, change values, delete runner-owned input nodes, or redeclare the supplied class.

## Edge cases

The result is null when every value repeats. Unique nodes before, between, and after repeated runs remain. A singleton is kept.

### Representation note

The result is displayed as original node indexes, verified from the returned objects. This is different from ordinary deduplication, which keeps one node from every run.
