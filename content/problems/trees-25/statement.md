## Validate the proposed parent relationships

The integer array `parents` describes nodes identified by their array positions. `parents[i]` is the proposed parent of node i; -1 marks a root. Return true exactly when the table describes one nonempty rooted binary tree:

- There is exactly one -1 entry.
- Every other parent is a valid node index distinct from its child.
- Every node reaches that one root by following parents, with no cycle or disconnected component.
- Each parent has at most two children.

The children are not labelled left and right; the test asks whether the relationships can form a binary tree, not whether values follow search-tree ordering. An empty table returns false. Out-of-range indices, extra roots and self-parent links return false.

`solve(parents)` receives the native integer array and returns boolean. No TreeNode construction or input parsing is required.
