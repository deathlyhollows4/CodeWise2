## Weave the front and back

Relink the original nodes into first, last, second, second-last order, continuing inward until every input node appears once. If the length is odd, the middle node appears once at the end.

## Your function

`solve(head)` receives a finite native singly linked list. A ListNode exposes `val` and `next`. Return the new native head after changing links. Do not allocate replacement nodes for the result or change any original node value. Empty input returns null.

## Identity rules

Equal-valued nodes remain distinct. Every original node must appear exactly once in the finite returned chain. Do not delete runner-owned nodes or redeclare the supplied node class.

### Representation note

The displayed result is the sequence of original input node indexes. The wrapper traverses your returned native chain and checks original identities and values; it rejects copied nodes, repetitions, and cycles. Your function returns a node, not an index array.
