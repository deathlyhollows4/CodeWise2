## Best nonempty simple path

A path is a nonempty sequence of distinct adjacent nodes connected by parent-child edges. Its endpoints may be any nodes. It can join two branches through an ancestor, but cannot revisit a node. Return the largest sum of node values on any such path. Include both endpoints.

For a nonempty tree, at least one node must be selected. Therefore an all-negative tree returns its largest node value, not zero. For an empty tree only, return zero. The optimal path need not pass through the root and need not end at leaves. Use a wide integer for accumulated totals.

## Native interface

`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve the input values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your function receives the native root.
