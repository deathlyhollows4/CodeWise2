## Find the first shared node

Two finite singly linked lists may share the same suffix. Return the first original node that belongs to both lists, or null when they share no node. Equal values alone do not mean two nodes are shared.

## Your function

`solve(data)` receives an `IdentityList` with two native heads in `heads[0]` and `heads[1]`. Each node exposes `val` and `next`. Both chains are acyclic, and every supplied node is reachable from at least one head. Return the shared original node object or pointer.

## Identity and mutation rules

Do not modify original node values or links, return an equal-valued replacement, delete input nodes, or redeclare the supplied classes. Either head may be null. The heads may already be the same node, and equal-valued disjoint chains still return null.

### Representation note

Examples use a shared node table with two head indexes. The runner preserves aliases when building native links. Table order need not match either traversal. The expected answer is the original node index, verified through the returned object's identity.
