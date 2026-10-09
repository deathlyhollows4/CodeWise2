## Distance total for every node

For each original node, add its edge distance to every node in the tree. A node’s distance to itself is zero. Return all these totals in breadth-first order of existing nodes, visiting a left child before a right child. Skip missing children: there are no null-placeholder entries in the result. An empty root returns an empty array; a singleton returns [0]. Node values, including duplicates and negative values, do not affect distances or ordering.

Distances follow the unique undirected parent-child route, so the origin may travel upward and into another branch. Each edge has length one. Return wide integer totals. Aim to calculate the whole result in O(n) by transferring a total between adjacent origins using subtree sizes.

## Native interface

`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve all original values and links. The runner supplies the class and constructs the tree; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your argument is the native root.
