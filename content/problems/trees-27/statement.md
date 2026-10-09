## Clear the tree with subtree operations

Every node value is 0 or 1. One operation chooses a node and flips every bit in its rooted subtree, including the chosen node. A flip changes 0 to 1 and 1 to 0. Return the minimum number of operations needed to make every node zero. Operations are conceptual: do not modify the input tree. The empty tree returns zero.

An ancestor operation affects both branches. A decision inside one branch does not affect its sibling. Toggling the same subtree twice cancels itself, so a minimum plan never needs to repeat the same chosen node.

### Why branch parity matters

After the choices at a node’s ancestors, its effective bit is fixed. Descendant operations cannot change that node. If its effective bit is one, a toggle at that node is forced; if it is zero, toggling there would require a redundant second toggle. Apply this decision independently down each branch to obtain a minimum plan. Return its operation count, not a list of nodes.

## Native interface

`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve the input values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your function receives the native root.
