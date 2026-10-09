## Add only the leaves

A leaf has neither a left child nor a right child. Return the sum of values in leaf nodes only. Ignore internal-node values. An empty tree has total 0; a singleton is itself a leaf, including when its value is negative. Use a wide integer accumulator for the total.

## Native interface

Your function receives a TreeNode root or null. A node has `val`, `left`, and `right`; missing children are null. The runner supplies the class and builds native links. Do not redeclare it, write a parser, delete input nodes, or change original values/links.

### Representation note

Examples display compact breadth-first values, using null for missing child slots and omitting trailing nulls. This is not heap-index numbering: children are read for existing parents in queue order. Your function receives actual nodes, not the displayed array.
