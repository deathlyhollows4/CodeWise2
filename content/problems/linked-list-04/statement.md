## Locate the cycle entry

Starting from the head, repeatedly follow `next`. Return the original node that is visited a second time first. This is the cycle entry. Return null when traversal reaches null without repeating a node.

## Your function

`solve(data)` receives an `IdentityList`. Its `heads[0]` is the native starting node, or null for an empty input. Each node has `val` and `next`; the supplied links may form a cycle. Every input node is reachable from this head.

Return the original entry node object or pointer. A fast/slow meeting point is not necessarily the entry. Equal-valued nodes must not be treated as the same node.

## Identity and mutation rules

Do not modify original values or links, return a copied node, delete input nodes, or redeclare the supplied classes. A self-loop begins at its only node. An acyclic list returns null.

### Representation note

Examples describe nodes with a values table, nullable next indexes, and one head index. The runner turns those indexes into real links before calling your function. Storage order may differ from traversal order. The expected answer is the original table index of the returned node, checked by object/pointer identity.
