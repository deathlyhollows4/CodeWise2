## Reach the target at a leaf

Return true if at least one complete route from the root to a leaf has values summing to target. Include every node on that route. A matching internal prefix does not count. Values may be negative, so a sum above target is not a reason to discard that branch. An empty tree has no route, even when target is zero.

`solve(root,target)` receives the native root and a signed wide integer. Accumulate with a wide integer type.

## Native arguments

Nodes are genuine TreeNode objects with val, left, and right. Missing children are null. The runner supplies the class and constructs links; do not redeclare it or write a parser. Do not change original values/links or delete input nodes.

### Representation note

Examples use compact breadth-first value arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives native roots, not those arrays.
