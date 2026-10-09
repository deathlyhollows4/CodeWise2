## Compare against all ancestors

Count nodes whose values are greater than or equal to every ancestor value on their own route from the root. The root always counts because it has no ancestor. Equality is allowed. A node that beats its immediate parent but remains below an earlier ancestor does not count. Values may be negative; do not initialize an ancestor maximum to zero. An empty tree returns zero.

## Native interface

`solve(root)` receives a genuine TreeNode root. Each node has `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and constructs the tree. Do not redeclare TreeNode, parse the example representation, or change input values or links.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are consumed for existing parents in queue order. These arrays describe the native input; they are not your function argument.
