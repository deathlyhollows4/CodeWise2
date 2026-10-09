## Cover every node

Choose nodes at which to place cameras. Each camera covers its own node, its parent if one exists, and its immediate left/right children. Return the minimum number of cameras needed to cover every node. Values do not affect coverage, and a camera does not cover a grandchild directly. An empty tree needs zero cameras.

You report the minimum count rather than changing the tree or annotating chosen nodes. Different placements can attain the same minimum.

## Native arguments

Nodes are genuine TreeNode objects with val, left, and right. Missing children are null. The runner supplies the class and constructs links; do not redeclare it or write a parser. Do not change original values/links or delete input nodes.

### Representation note

Examples use compact breadth-first value arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives native roots, not those arrays.
