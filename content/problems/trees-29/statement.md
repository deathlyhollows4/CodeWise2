## Select nodes without adjacent pairs

Choose any set of original nodes such that no selected node is the parent or child of another selected node. Maximize the sum of selected node values and return that total. A selected node may coexist with grandchildren and with nodes in other branches. Nodes with equal values are still different nodes.

Values are signed. You may select no nodes, giving total zero; therefore an all-negative tree returns zero. An empty tree also returns zero. The selection need not be connected and does not have to include the root. This is a node-set constraint, not a path or a camera-cover requirement. Use a wide integer for the total.

## Native interface

`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve all original values and links. The runner supplies the class and constructs the tree; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your argument is the native root.
