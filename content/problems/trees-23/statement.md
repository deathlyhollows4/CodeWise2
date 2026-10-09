## Inclusive key-range total

Return the sum of all node values between lo and hi, including both endpoints. lo≤hi. An empty tree or a range containing no key returns zero. Negative values are included normally and may make the total negative. Use a wide integer for the result.

`solve(root,lo,hi)` receives the native root and two integer bounds. Use the search-tree ordering to skip subtrees that cannot contain a key in the range. Every matching original node contributes exactly once.

## Native tree contract

The root is a genuine TreeNode with `val`, `left`, and `right`; missing children and an empty root are null. Input values are unique. All values in a left subtree are strictly smaller than its root, and all values in a right subtree are strictly larger. This is a whole-subtree ordering promise, not only a parent-child comparison. Preserve original values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.

### Representation note

Examples use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives the native root.
