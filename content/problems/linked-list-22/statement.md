## Flatten the original multilevel nodes

Each native MultiListNode has `val`, `next`, `prev`, and `child`. next/prev connect siblings; child points to the head of a nested list. Return the original head after flattening all nodes into one doubly linked chain in depth-first order: visit a node, then its complete child list, then its next sibling. A child list may itself contain nested children.

Use every original node exactly once and preserve every value. Relink the existing objects; do not return copied nodes or integer IDs. In the final chain every child field is null, head.prev is null, the last next is null, and each next/prev pair is reciprocal. An empty head returns null.

The input has no cycles, shared nodes, or disconnected nodes. A child head has prev=null. Root head.prev is null, and sibling next/prev links are consistent.

`solve(head)` receives the genuine MultiListNode head. The runner supplies the class and constructs the links; do not redeclare it or write a parser.

### Representation and identity notes

Example input tables identify original objects by row index: values contains val fields; next/child entries are a row index or null; head selects the root row. The runner derives prev from sibling next links. Output arrays display original row indices in flattened order, but your return value must be the native head object. The checker also validates cleared child fields, unchanged values and reciprocal previous links.
