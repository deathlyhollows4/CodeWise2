## Mirror the structure

Return a tree in which every original node position has its left and right subtrees exchanged, recursively throughout the tree. Keep the corresponding values. Missing children must also exchange sides. An empty tree returns null.

## Mutation and result rules

You may change input child links or build a new native tree. This task checks result values and topology, not original node identity. Return a native TreeNode root, not an array. Do not delete runner-owned input nodes or redeclare the supplied class.

## Native function

You receive a TreeNode root or null. Nodes expose val, left, and right. The runner supplies the class and native links; do not redeclare it or parse JSON. Do not delete input nodes.

### Representation note

Examples show compact breadth-first values with null child slots and no trailing nulls. Children are read for existing parents in queue order, rather than using heap indexes. Your function receives actual linked nodes.
