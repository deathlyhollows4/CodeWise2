## Find the survivor

Starting from the head of a circular list, count nodes beginning at 1. Remove the kth counted node, resume counting at its next node, and repeat until one node remains. Return that original survivor. An empty input returns null.

## Your function

`solve(data, k)` receives an IdentityList and a positive integer. `data.heads[0]` is the native starting ListNode, whose `val` and `next` fields describe its value and circular link. Every supplied node belongs to this single ring. The next table is a permutation: each node has exactly one next link and one incoming link.

Return the original surviving node object or pointer, not its value or a copied node. You may calculate which node would survive; do not actually change any original values or links. Do not delete input nodes or redeclare the supplied classes.

## Edge cases

A singleton survives for every k. When k is larger than the ring, counting wraps as often as needed. With k=1, removal starts at the head.

### Representation note

Examples show a node table and one head index. The runner builds native links before calling your function. The expected result is the original node index, checked by returned object identity. Table storage order can differ from ring order.
