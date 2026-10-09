## Canonical key deletion

Return the root after deleting `value`, using these exact rules:

- If the key is absent, preserve the value-and-shape tree.
- A leaf is replaced by null.
- A node with one child is replaced by that child.
- For a node with two children, replace its value with the minimum value from its right subtree, then remove that successor node from its old location. The successor has no left child; its right child, if any, takes its old place.

Apply the rules at the root as well as below it. Use the right-subtree successor, not the left-subtree predecessor, so the output shape is deterministic. An empty input remains empty.

You may relink input nodes or allocate an equivalent result; original-object reuse is not required. Other original values retain the positions prescribed by the rule, with no rebalancing.

## Native interface

`solve(root, value)` receives a genuine TreeNode root and an integer. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and links. Do not redeclare TreeNode or write a parser.

The input is a strict binary search tree: **all** values in a left subtree are smaller than its root, and **all** values in a right subtree are larger. Values are unique. This promise applies to whole subtrees, not just immediate children.

### Representation note

Examples show compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order. Your arguments are the native root and integer, not these arrays.
