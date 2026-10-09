## Stably sort the list

Relink the original nodes into nondecreasing value order. When two nodes have equal values, preserve their original relative order. Return the new head.

## Your function

`solve(head)` receives a finite native singly linked list. Each ListNode has `val` and `next`. Return a native chain containing every original node once. Change links rather than values; do not substitute newly allocated equal-valued nodes. Empty input returns null.

## Stability and identity

For input values [3,1,3,1], the sorted original-node order is [1,3,0,2]. The nodes containing 1 retain their order, and so do the nodes containing 3. Do not delete input nodes or redeclare the supplied class. Aim for O(n log n) time.

### Representation note

The wrapper displays original node indexes, not just sorted values. It checks actual original identities, unchanged values, and a finite chain with no repeated node. Your function returns a native head, not an index array.
