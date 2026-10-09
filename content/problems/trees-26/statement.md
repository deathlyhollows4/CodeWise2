## Count all downward target routes

Return the number of nonempty routes whose node values sum to `target`. A route starts at any node and follows zero or more child links downward, ending at any descendant, including its starting node. It cannot turn upward or switch between sibling branches. The endpoints need not be the root or leaves. Count different start/end node pairs separately, even when their values are identical. Routes may overlap.

Values may be negative or zero. An empty tree returns zero, including when target is zero; an empty route never counts. Use wide signed arithmetic for totals and prefix differences. The answer fits an ordinary integer: at most 2,001,000 routes for 2,000 nodes.

`solve(root,target)` receives a genuine TreeNode root and a wide integer. Nodes have `val`, `left`, and `right`; missing children are null. Preserve original values and links. The runner supplies the class and constructs the tree; do not redeclare it or parse the example representation.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls; child slots are read for existing parents in queue order. Your function receives the native root.
