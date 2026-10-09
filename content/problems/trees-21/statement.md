## Validate a strict search tree

Return true if every node has all left-subtree values strictly smaller and all right-subtree values strictly larger than its own value. The input is an arbitrary binary tree; it is not promised to be ordered. Duplicate values anywhere make the answer false. Compare entire subtrees against ancestor bounds, not just immediate children. An empty tree and a singleton are valid. Preserve all original values and links.

`solve(root)` receives a native root and returns boolean.

## Native interface

The runner supplies genuine TreeNode objects with `val`, `left`, and `right`. Missing children and an empty root are null. Do not redeclare the class or write a representation parser.

### Representation note

Example tree results use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. These arrays describe native trees.
