## Find an exact key

Return whether the tree contains a node whose value equals `value`. Follow the strict search-tree ordering to choose the next child. An empty root returns false. Equality at the current node succeeds, including at the root. Preserve every input value and link.

## Native interface

`solve(root, value)` receives a genuine TreeNode root and an integer. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and links. Do not redeclare TreeNode or write a parser.

The input is a strict binary search tree: **all** values in a left subtree are smaller than its root, and **all** values in a right subtree are larger. Values are unique. This promise applies to whole subtrees, not just immediate children.

### Representation note

Examples show compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order. Your arguments are the native root and integer, not these arrays.
