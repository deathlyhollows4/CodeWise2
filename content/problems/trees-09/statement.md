## Compare values and structure

Return true exactly when a and b have the same shape and equal values at every corresponding node. Compare left with left and right with right. These are two arbitrary input trees, not a request to mirror either one. Two empty roots are equal; one empty and one nonempty root are not. Duplicate values do not hide a structural difference.

## Native arguments

Nodes are genuine TreeNode objects with val, left, and right. Missing children are null. The runner supplies the class and constructs links; do not redeclare it or write a parser. Do not change original values/links or delete input nodes.

### Representation note

Examples use compact breadth-first value arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives native roots, not those arrays.
