## Select a node from the end

Return the original node that is `k` positions from the end of the list. With `k = 1`, select the tail. Return null if the list contains fewer than `k` nodes.

## Your function

`solve(head, k)` receives a finite native singly linked list and a positive integer. Each `ListNode` has `val` and `next`. Return the selected original node object or pointer, rather than its value or a newly allocated replacement.

## Identity and mutation rules

Two nodes containing the same value are still different nodes. Do not modify any original node value or link. Do not delete input nodes or redeclare the supplied node class.

An empty list has no selected node. A value of `k` equal to the list length selects the head; a larger value returns null.

### Representation note

The displayed expected answer is the selected node's zero-based index in the original input construction. The wrapper obtains that index by checking the returned object's actual identity. Your function still returns a native node.
