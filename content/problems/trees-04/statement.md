## Visit in preorder

Return the values in preorder: visit the current node, then its entire left subtree, then its entire right subtree. Apply that rule at every node. Preserve repeated values because different nodes each produce one visit. An empty tree returns an empty native array/list.

## Native interface

Your function receives a TreeNode root or null. A node has `val`, `left`, and `right`; missing children are null. The runner supplies the class and builds native links. Do not redeclare it, write a parser, delete input nodes, or change original values/links.

### Representation note

Examples display compact breadth-first values, using null for missing child slots and omitting trailing nulls. This is not heap-index numbering: children are read for existing parents in queue order. Your function receives actual nodes, not the displayed array.
