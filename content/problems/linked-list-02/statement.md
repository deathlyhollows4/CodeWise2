## Remove every match

Remove every node whose value equals the supplied `value`. Return the head of a finite linked list containing the remaining values in their original order. A run of matches at the beginning, middle, or end must be removed completely.

## Your function

`solve(head, value)` receives a native `ListNode` head and an integer. A node exposes `val` and `next`. Return the resulting native head, or null if no value remains. The runner constructs the input and supplies the node class.

The result is checked by its value sequence. You may relink input nodes or allocate a new result list. Do not redeclare the node class, write an input parser, or delete runner-owned nodes in C++.

## Edge cases

An empty input stays empty. All nodes may match, or the target may be absent. Repeated matches must not cause the node after a removal to be skipped.

### Representation note

Examples show list values as arrays; an empty displayed array corresponds to a null returned head.
