## Add two digit lists

Each list represents a nonnegative integer, with its least significant decimal digit first. For example, the values `[2, 4, 3]` represent 342. Return a linked list representing the sum in the same digit order.

## Your function

`solve(left, right)` receives two nonempty native `ListNode` heads. A node's `val` is one digit from 0 through 9, and `next` points to the following digit. Return a native result head. You may reuse input nodes or allocate result nodes; this task checks result digits rather than preserved input identity.

## Zero and carry rules

Most-significant zero nodes are allowed in the inputs: `[0, 0]` represents zero. The output must be canonical. Represent zero with exactly one node containing 0. Otherwise, the final, most-significant output node must be nonzero. A final carry may create one more node than either input has.

Inputs contain between 1 and 2,000 nodes each; empty inputs are invalid. Return a finite list with at most 2,001 nodes. Do not return an integer or array, write a parser, redeclare the node class, or delete runner-owned input nodes.
