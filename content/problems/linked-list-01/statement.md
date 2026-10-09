## Add one value

You receive a singly linked list whose values are in nondecreasing order, and an integer `value`. Return a sorted linked list containing all input values plus one additional occurrence of that value. Keep every existing occurrence, including duplicates.

## Your function

`solve(head, value)` receives the first `ListNode`, or null for an empty list. Each node has a value in `val` and a link to the following node in `next`. Return the first node of the result. The runner supplies the node class and builds the input; you do not write a parser or redeclare the class.

You may reuse input nodes or allocate a new result list. The result is checked by its value sequence; preserving original node identities is not required here. Splicing one new node into the right position is an efficient approach. In C++, do not delete runner-owned input nodes.

## Edge cases

An empty input becomes a one-node list. The new value may belong before the head, after the tail, or within a run of equal values. The returned list must be finite.

### Representation note

Examples display a linked list as an array of values. Your function receives native nodes and returns a native node, not an array.
