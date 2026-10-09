## Apply the moves

Initially, node indexes follow the input list from 0 onward. For each operation, cut the node identified by cutIds[i] from its current location and insert it immediately after the original node identified by afterIds[i]. An after identifier of -1 means insert at the front. If both identifiers name the same node, leave the list unchanged. Every node keeps its original identifier through every move.

`solve(head,cutIds,afterIds)` receives a native head and two equally long integer arrays. Return the final native head. The list may be empty only when the operation arrays are empty. Moving an already-front node to the front, adjacent moves and repeated moves are allowed. Aim for O(n + m) work with original-node lookup and maintained predecessor links.

## Native ownership

The function receives a real ListNode head. Nodes expose val and next; the supplied class and parser are handled by the runner. Preserve original values and return a finite chain using each original node once. Do not substitute copied nodes or delete runner-owned nodes.

### Representation note

The displayed output is the original-node index sequence. Those indexes refer to the initial input traversal and are checked through actual object/pointer identity, not equal values. Your function returns a native node, not an index array.
