## Every subtree must be balanced

Return true when every node has left and right subtree heights differing by at most one. Height counts nodes: an empty child has height zero and a leaf has height one. Check all nodes, not just the root. Values do not affect the answer. Empty and singleton trees are balanced.

## Native interface

`solve(root)` receives a genuine TreeNode root. Each node has `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and constructs the tree. Do not redeclare TreeNode, parse the example representation, or change input values or links.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are consumed for existing parents in queue order. These arrays describe the native input; they are not your function argument.
