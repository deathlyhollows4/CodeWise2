## Reverse one interval

Reverse the original nodes from zero-based position left through right, inclusive. Keep all nodes before and after that interval in their original order. If left equals right, leave the chain unchanged.

`solve(head,left,right)` receives a nonempty native list and valid positions with left ≤ right. Return the resulting native head. Reversing an interval starting at position 0 may change the head.

## Native ownership

The function receives a real ListNode head. Nodes expose val and next; the supplied class and parser are handled by the runner. Preserve original values and return a finite chain using each original node once. Do not substitute copied nodes or delete runner-owned nodes.

### Representation note

The displayed output is the original-node index sequence. Those indexes refer to the initial input traversal and are checked through actual object/pointer identity, not equal values. Your function returns a native node, not an index array.
