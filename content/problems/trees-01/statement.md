## Count the nodes

Return the number of existing nodes in the binary tree. A missing child contributes nothing. Count two different nodes separately even when they contain the same value. An empty tree has count 0.

## Native interface

Your function receives a TreeNode root or null. A node has `val`, `left`, and `right`; missing children are null. The runner supplies the class and builds native links. Do not redeclare it, write a parser, delete input nodes, or change original values/links.

### Representation note

Examples display compact breadth-first values, using null for missing child slots and omitting trailing nulls. This is not heap-index numbering: children are read for existing parents in queue order. Your function receives actual nodes, not the displayed array.
