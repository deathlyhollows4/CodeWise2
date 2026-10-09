## Return the levels

Return one row for every depth, starting with the root at depth 0. Each row contains all node values at that depth in left-to-right order. Include internal nodes and leaves, keeping duplicate values as separate visits. An empty tree returns no rows; a singleton returns one row.

Do not modify original values or links.

## Native function

You receive a TreeNode root or null. Nodes expose val, left, and right. The runner supplies the class and native links; do not redeclare it or parse JSON. Do not delete input nodes.

### Representation note

Examples show compact breadth-first values with null child slots and no trailing nulls. Children are read for existing parents in queue order, rather than using heap indexes. Your function receives actual linked nodes.
