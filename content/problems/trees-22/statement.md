## Select an original node by key rank

Return the original TreeNode whose key is the kth smallest in the tree. k is one-based: k=1 asks for the minimum key. If the tree has fewer than k nodes, return null. An empty root always returns null.

Return the actual existing object, not its integer value and not a newly allocated node with the same value. Preserve all original links and values. `solve(root,k)` receives the native root and integer rank, and returns TreeNode or null.

## Native tree contract

The root is a genuine TreeNode with `val`, `left`, and `right`; missing children and an empty root are null. Input values are unique. All values in a left subtree are strictly smaller than its root, and all values in a right subtree are strictly larger. This is a whole-subtree ordering promise, not only a parent-child comparison. Preserve original values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives the native root.

### Identity in example results

The checker displays a returned node as its original non-null slot index in the example input array. That display is not your return type: return the native object, and the runner checks its identity.
