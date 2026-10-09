## Lowest common original ancestor

Return the lowest common ancestor of the two target objects in the supplied tree. An ancestor includes the node itself. Lowest means deepest: choose the original node farthest from the root that is an ancestor of both targets. Both targets are guaranteed to be original non-null nodes in this one tree. They may be the same object; then return that object. If one target is an ancestor of the other, return that ancestor.

Node values may repeat and do not identify the targets. Return the actual original TreeNode object, not its value or a copied node. Preserve all original values and links.

### Native interface

`solve(data)` receives an IdentityTree object. `data.root` is the genuine TreeNode root and `data.targets` contains two genuine references into that same tree. Nodes have val, left, and right; missing children are null. The runner supplies the classes and builds the links and target references; do not redeclare them or parse a table.

### Representation and identity notes

Examples describe data with a compact breadth-first values array and targetIndices selecting its non-null original slots. Null child slots still occupy positions in that display. The output shows the original array slot of the returned node, but your return type is the native TreeNode object. Your function does not receive integer target indices.
