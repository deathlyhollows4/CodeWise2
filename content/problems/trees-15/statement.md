## Repeated subtree types

Every node roots a subtree containing that node and all its descendants. Two such subtrees have the same type when their root values agree and their corresponding left and right child subtrees have the same types; null children must match. Count how many distinct types occur at two or more original nodes. Count each qualifying type once, even when it occurs three or more times. Leaves are valid subtree types. Null is not a type to count. An empty tree returns zero.

Equal values alone do not establish equal subtrees, and exchanging left and right children changes a type unless those two child types are already equal.

## Native interface

`solve(root)` receives a genuine TreeNode root. Each node has `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and constructs the tree. Do not redeclare TreeNode, parse the example representation, or change input values or links.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are consumed for existing parents in queue order. These arrays describe the native input; they are not your function argument.
