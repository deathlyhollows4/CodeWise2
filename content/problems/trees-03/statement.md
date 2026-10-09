## Measure the height

Return the largest number of nodes on any route from the root to a leaf. Count the root and the leaf. An empty tree has height 0; a singleton has height 1. Node values do not affect height. A route follows child links, and one long branch must not be averaged with a shorter branch.

## Native interface

Your function receives a TreeNode root or null. A node has `val`, `left`, and `right`; missing children are null. The runner supplies the class and builds native links. Do not redeclare it, write a parser, delete input nodes, or change original values/links.

### Representation note

Examples display compact breadth-first values, using null for missing child slots and omitting trailing nulls. This is not heap-index numbering: children are read for existing parents in queue order. Your function receives actual nodes, not the displayed array.
