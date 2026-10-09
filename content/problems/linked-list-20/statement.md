## Normalize zero-sum blocks

Repeatedly remove a nonempty consecutive block whose values sum to zero. Stop only when the retained list contains no nonempty zero-sum consecutive block. Return the native head of any valid terminal survivor chain.

## Native identity rules

`solve(head)` receives a finite native ListNode chain with signed values. Nodes expose val and next. You may change next links, but survivors keep their original relative order, identities, and values. Do not substitute copied nodes, change values, delete runner-owned nodes, or redeclare the supplied class. Empty input returns null.

## Multiple valid answers

For [1,2,-3,3,1], original nodes [3,4] and [0,1,4] are both valid results. The examples show one accepted result; they do not require that exact witness. A zero-valued retained node is itself a removable block and cannot remain.

### Representation note

The wrapper traverses your returned native chain and displays original node indexes. The checker verifies ordered original survivors, zero-sum removed gaps, and absence of a zero-sum block in the final chain.
