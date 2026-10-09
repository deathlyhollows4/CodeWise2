## Longest path between any two nodes

Return the maximum number of edges on a simple path between any two nodes. The endpoints may be internal nodes or leaves, and the path need not pass through the root. Count edges, not nodes. An empty tree and a singleton return zero. Node values do not affect path length.

## Native interface

`solve(root)` receives a genuine TreeNode root. Each node has `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and constructs the tree. Do not redeclare TreeNode, parse the example representation, or change input values or links.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are consumed for existing parents in queue order. These arrays describe the native input; they are not your function argument.
