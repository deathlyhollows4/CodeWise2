## Insert one unique key

Return the root of the tree after inserting `value`. This question introduces the binary-search-tree route: start at the root, compare the requested key with the current value, and choose the left child for a smaller key or the right child for a larger key. Repeat until you find the key or a null child. If the key already exists, return the same value-and-shape tree without adding a duplicate. Otherwise put the new key at that null child as a leaf. An empty input becomes a singleton. Do not rebalance or relocate existing values: the expected output shape is this exact leaf insertion.

You may relink the input nodes or return a newly allocated equivalent tree; original-object reuse is not required. The result has at most 2,001 nodes.

## Native interface

`solve(root, value)` receives a genuine TreeNode root and an integer. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and links. Do not redeclare TreeNode or write a parser.

The input is a strict binary search tree: **all** values in a left subtree are smaller than its root, and **all** values in a right subtree are larger. Values are unique. This promise applies to whole subtrees, not just immediate children.

### Representation note

Examples show compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order. Your arguments are the native root and integer, not these arrays.
