## Clone the linked structure

Create an independent copy of the structure reachable from the input root through `next` and `random`. Preserve every node value and both kinds of link. A link may be null, shared by several nodes, point to the same node, or form a cycle.

## Your function

`solve(data)` receives an `IdentityList`. Its `heads[0]` is the native root, or null for an empty input. A `ListNode` exposes `val`, `next`, and `random`. Every supplied node is reachable from the root across these links. Return the native root of the clone, or null for an empty structure.

## Identity and mutation rules

Allocate one new node for each original node. Different original nodes with equal values must remain different clone nodes. A shared target must stay shared in the clone. No output node may be an original input node.

Do not change original values or links, delete input nodes, redeclare the supplied classes, or return JSON. Both `next` and `random` cycles are allowed.

### Representation note

Examples describe the structure with value and link-index tables. The runner supplies actual linked nodes to your function. To display a result, the wrapper numbers reachable clone nodes breadth first, examining `next` before `random`. The `aliasesOriginal` result flag must be false. Your solution returns a native root; it does not generate these tables.
