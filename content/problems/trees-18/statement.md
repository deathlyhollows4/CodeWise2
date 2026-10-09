## Rotate only the root

Perform exactly one rotation in the specified direction. For `LEFT`, the root’s right child becomes the new root. The pivot’s old left subtree becomes the old root’s right subtree, and the old root becomes the pivot’s left child. A `RIGHT` rotation is the mirror rule: the left child becomes the new root, its old right subtree becomes the old root’s left subtree, and the old root becomes the pivot’s right child.

If the required pivot child does not exist, return the tree unchanged. An empty root returns null. Apply the operation only at the root, not recursively at every node. Every other subtree keeps its internal structure. The entire inorder value sequence is preserved, even for an arbitrary tree that is not a binary search tree.

## Native result contract

`solve(root, direction)` receives a native TreeNode and the string `LEFT` or `RIGHT`. Return a native TreeNode root. You may relink input child pointers or build a new native tree. Grading checks the precise resulting topology and corresponding node values; original node identity and original-input immutability are not required. Do not delete runner-owned input nodes or redeclare the supplied class.

### Representation note

Examples display compact breadth-first values with null child slots. The wrapper constructs native nodes before calling your method and serializes the returned native tree. Return a node, not a serialized array. Duplicate and negative values do not change which links rotate.
