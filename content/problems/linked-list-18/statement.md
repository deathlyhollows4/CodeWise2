## Rotate to the right

Move the last k nodes to the front, preserving their order and the order of the remaining prefix. Counts greater than the list length wrap modulo that length. A zero count leaves the list unchanged, and an empty input returns null.

`solve(head,k)` receives the native head and a nonnegative integer. Return the new native head. The returned chain must be finite: if you temporarily close a ring, break it at the new tail.

## Native ownership

The function receives a real ListNode head. Nodes expose val and next; the supplied class and parser are handled by the runner. Preserve original values and return a finite chain using each original node once. Do not substitute copied nodes or delete runner-owned nodes.

### Representation note

The displayed output is the original-node index sequence. Those indexes refer to the initial input traversal and are checked through actual object/pointer identity, not equal values. Your function returns a native node, not an index array.
