## Check completeness

A complete binary tree has every level full except possibly its last level, whose nodes occupy the leftmost positions without gaps. Return whether the input has this shape. Values do not affect completeness. An empty tree and a singleton are complete. A node with a right child but no left child is incomplete.

## Native arguments

Nodes are genuine TreeNode objects with val, left, and right. Missing children are null. The runner supplies the class and constructs links; do not redeclare it or write a parser. Do not change original values/links or delete input nodes.

### Representation note

Examples use compact breadth-first value arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives native roots, not those arrays.
