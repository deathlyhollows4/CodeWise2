## Peel the tree in rounds

In round 0, collect every current leaf and remove all of them simultaneously. In each following round, collect and remove all nodes that have now become leaves. Continue until the tree is empty. Return the collected values as one row per round, preserving repeated values from distinct nodes.

Within each round, list the original nodes from left to right in the original tree. Nodes in one round are never ancestors of each other; the first left/right choice after their common ancestor defines this order. A newly exposed parent waits until the next round, rather than joining the round that removed its children.

These removals are conceptual: leave the original node values and links unchanged. An empty tree returns no rows, and a singleton appears in round 0. Every original node contributes exactly once.

## Native function

You receive a TreeNode root or null. Nodes expose val, left, and right. The runner supplies the class and native links; do not redeclare it or parse JSON. Do not delete input nodes.

### Representation note

Examples show compact breadth-first values with null child slots and no trailing nulls. Children are read for existing parents in queue order, rather than using heap indexes. Your function receives actual linked nodes.
