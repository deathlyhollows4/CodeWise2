## Merge two sorted native chains

Two nondecreasing chains may share the same physical suffix. Merge their disjoint prefixes in sorted order, choosing the first chain before the second when prefix values tie. Then append the shared suffix once. If no suffix is shared, merge both whole chains. Every original node in the union must appear once, with its value unchanged.

## Native function

`solve(data)` receives IdentityList with native heads in heads[0] and heads[1]. A ListNode exposes val and next. Both chains are finite and sorted; either head may be null. Return the native merged head. You may change next links, but do not substitute copied nodes, change values, or delete input nodes.

## Aliasing edge cases

Identical heads already describe one chain. A chain can start inside the other chain. Equal values in a disjoint prefix are not shared nodes, and the shared suffix must follow both disjoint prefixes even when their values tie. An ordinary value-only merge can create a cycle by consuming a shared node twice.

### Representation note

Examples use one table of original nodes and two head indexes. Storage order may differ from traversal order. The result is displayed as original node indexes checked from the returned native chain.
