// Learner-facing text kept separate from trusted schemas and serializers.
export const statements={
 'linked-list-01':`## Add one value

You receive a singly linked list whose values are in nondecreasing order, and an integer \`value\`. Return a sorted linked list containing all input values plus one additional occurrence of that value. Keep every existing occurrence, including duplicates.

## Your function

\`solve(head, value)\` receives the first \`ListNode\`, or null for an empty list. Each node has a value in \`val\` and a link to the following node in \`next\`. Return the first node of the result. The runner supplies the node class and builds the input; you do not write a parser or redeclare the class.

You may reuse input nodes or allocate a new result list. The result is checked by its value sequence; preserving original node identities is not required here. Splicing one new node into the right position is an efficient approach. In C++, do not delete runner-owned input nodes.

## Edge cases

An empty input becomes a one-node list. The new value may belong before the head, after the tail, or within a run of equal values. The returned list must be finite.

### Representation note

Examples display a linked list as an array of values. Your function receives native nodes and returns a native node, not an array.`,
 'linked-list-02':`## Remove every match

Remove every node whose value equals the supplied \`value\`. Return the head of a finite linked list containing the remaining values in their original order. A run of matches at the beginning, middle, or end must be removed completely.

## Your function

\`solve(head, value)\` receives a native \`ListNode\` head and an integer. A node exposes \`val\` and \`next\`. Return the resulting native head, or null if no value remains. The runner constructs the input and supplies the node class.

The result is checked by its value sequence. You may relink input nodes or allocate a new result list. Do not redeclare the node class, write an input parser, or delete runner-owned nodes in C++.

## Edge cases

An empty input stays empty. All nodes may match, or the target may be absent. Repeated matches must not cause the node after a removal to be skipped.

### Representation note

Examples show list values as arrays; an empty displayed array corresponds to a null returned head.`,
 'linked-list-03':`## Select a node from the end

Return the original node that is \`k\` positions from the end of the list. With \`k = 1\`, select the tail. Return null if the list contains fewer than \`k\` nodes.

## Your function

\`solve(head, k)\` receives a finite native singly linked list and a positive integer. Each \`ListNode\` has \`val\` and \`next\`. Return the selected original node object or pointer, rather than its value or a newly allocated replacement.

## Identity and mutation rules

Two nodes containing the same value are still different nodes. Do not modify any original node value or link. Do not delete input nodes or redeclare the supplied node class.

An empty list has no selected node. A value of \`k\` equal to the list length selects the head; a larger value returns null.

### Representation note

The displayed expected answer is the selected node's zero-based index in the original input construction. The wrapper obtains that index by checking the returned object's actual identity. Your function still returns a native node.`,
 'linked-list-04':`## Locate the cycle entry

Starting from the head, repeatedly follow \`next\`. Return the original node that is visited a second time first. This is the cycle entry. Return null when traversal reaches null without repeating a node.

## Your function

\`solve(data)\` receives an \`IdentityList\`. Its \`heads[0]\` is the native starting node, or null for an empty input. Each node has \`val\` and \`next\`; the supplied links may form a cycle. Every input node is reachable from this head.

Return the original entry node object or pointer. A fast/slow meeting point is not necessarily the entry. Equal-valued nodes must not be treated as the same node.

## Identity and mutation rules

Do not modify original values or links, return a copied node, delete input nodes, or redeclare the supplied classes. A self-loop begins at its only node. An acyclic list returns null.

### Representation note

Examples describe nodes with a values table, nullable next indexes, and one head index. The runner turns those indexes into real links before calling your function. Storage order may differ from traversal order. The expected answer is the original table index of the returned node, checked by object/pointer identity.`,
 'linked-list-05':`## Find the first shared node

Two finite singly linked lists may share the same suffix. Return the first original node that belongs to both lists, or null when they share no node. Equal values alone do not mean two nodes are shared.

## Your function

\`solve(data)\` receives an \`IdentityList\` with two native heads in \`heads[0]\` and \`heads[1]\`. Each node exposes \`val\` and \`next\`. Both chains are acyclic, and every supplied node is reachable from at least one head. Return the shared original node object or pointer.

## Identity and mutation rules

Do not modify original node values or links, return an equal-valued replacement, delete input nodes, or redeclare the supplied classes. Either head may be null. The heads may already be the same node, and equal-valued disjoint chains still return null.

### Representation note

Examples use a shared node table with two head indexes. The runner preserves aliases when building native links. Table order need not match either traversal. The expected answer is the original node index, verified through the returned object's identity.`,
 'linked-list-06':`## Add two digit lists

Each list represents a nonnegative integer, with its least significant decimal digit first. For example, the values \`[2, 4, 3]\` represent 342. Return a linked list representing the sum in the same digit order.

## Your function

\`solve(left, right)\` receives two nonempty native \`ListNode\` heads. A node's \`val\` is one digit from 0 through 9, and \`next\` points to the following digit. Return a native result head. You may reuse input nodes or allocate result nodes; this task checks result digits rather than preserved input identity.

## Zero and carry rules

Most-significant zero nodes are allowed in the inputs: \`[0, 0]\` represents zero. The output must be canonical. Represent zero with exactly one node containing 0. Otherwise, the final, most-significant output node must be nonzero. A final carry may create one more node than either input has.

Inputs contain between 1 and 2,000 nodes each; empty inputs are invalid. Return a finite list with at most 2,001 nodes. Do not return an integer or array, write a parser, redeclare the node class, or delete runner-owned input nodes.`,
 'linked-list-07':`## Clone the linked structure

Create an independent copy of the structure reachable from the input root through \`next\` and \`random\`. Preserve every node value and both kinds of link. A link may be null, shared by several nodes, point to the same node, or form a cycle.

## Your function

\`solve(data)\` receives an \`IdentityList\`. Its \`heads[0]\` is the native root, or null for an empty input. A \`ListNode\` exposes \`val\`, \`next\`, and \`random\`. Every supplied node is reachable from the root across these links. Return the native root of the clone, or null for an empty structure.

## Identity and mutation rules

Allocate one new node for each original node. Different original nodes with equal values must remain different clone nodes. A shared target must stay shared in the clone. No output node may be an original input node.

Do not change original values or links, delete input nodes, redeclare the supplied classes, or return JSON. Both \`next\` and \`random\` cycles are allowed.

### Representation note

Examples describe the structure with value and link-index tables. The runner supplies actual linked nodes to your function. To display a result, the wrapper numbers reachable clone nodes breadth first, examining \`next\` before \`random\`. The \`aliasesOriginal\` result flag must be false. Your solution returns a native root; it does not generate these tables.`,
 'linked-list-08':`## Reverse complete groups

Split the list into consecutive groups of \`k\` nodes. Reverse the values of each complete group while keeping the groups in their original order. Leave any shorter final group in its original order.

## Your function

\`solve(head, k)\` receives a finite native singly linked list and an integer with \`1 ≤ k ≤ 2,001\`. A node has \`val\` and \`next\`. Return the head of a finite native result list.

The result is checked by its value sequence. You may reuse input nodes or allocate a new list; original node identities are not required. Do not return an array, parse JSON, redeclare the supplied node class, or delete runner-owned input nodes.

## Edge cases

An empty input returns null. With \`k = 1\`, values stay unchanged. If \`k\` exceeds the length, the entire input is an incomplete group and stays unchanged. The result must have exactly the input length.

### Representation note

Examples display list values as arrays. For \`[1, 2, 3, 4, 5]\` and \`k = 3\`, the result is \`[3, 2, 1, 4, 5]\`: the last two values are not reversed.`
};

