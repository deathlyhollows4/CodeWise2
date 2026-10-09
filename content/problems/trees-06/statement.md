## Trace the boundary

Return the boundary values in this order: the root once, the non-leaf left boundary top down, every leaf left to right, then the non-leaf right boundary bottom up. A singleton returns its root value once; an empty tree returns an empty array.

The left boundary starts at root.left. At each node choose left if present, otherwise right, stopping at a leaf. If root.left is null, that boundary is empty. The right boundary starts at root.right, chooses right if present otherwise left, and is returned in reverse order without its leaf.

Do not modify original values or links. Different nodes with equal values still contribute separate visits when they belong on the boundary.

## Native function

You receive a TreeNode root or null. Nodes expose val, left, and right. The runner supplies the class and native links; do not redeclare it or parse JSON. Do not delete input nodes.

### Representation note

Examples show compact breadth-first values with null child slots and no trailing nulls. Children are read for existing parents in queue order, rather than using heap indexes. Your function receives actual linked nodes.
