## Reconstruct the native tree

Return the unique binary tree whose preorder traversal is `preorder` and whose inorder traversal is `inorder`. Preorder visits root, left subtree, then right subtree. Inorder visits left subtree, root, then right subtree. Values are distinct. The arrays have equal lengths, contain the same values, and are guaranteed to be compatible traversals of one tree. Two empty arrays return null.

`solve(preorder, inorder)` receives two native integer arrays and returns a newly constructed TreeNode root. You may use an iterative stack to handle a long skewed tree. Do not assume the values are sorted or that the result is a binary search tree.

## Native interface

The runner supplies genuine TreeNode objects with `val`, `left`, and `right`. Missing children and an empty root are null. Do not redeclare the class or write a representation parser.

### Representation note

Example tree results use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. These arrays describe native trees.
