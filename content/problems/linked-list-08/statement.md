## Reverse complete groups

Split the list into consecutive groups of `k` nodes. Reverse the values of each complete group while keeping the groups in their original order. Leave any shorter final group in its original order.

## Your function

`solve(head, k)` receives a finite native singly linked list and an integer with `1 ≤ k ≤ 2,001`. A node has `val` and `next`. Return the head of a finite native result list.

The result is checked by its value sequence. You may reuse input nodes or allocate a new list; original node identities are not required. Do not return an array, parse JSON, redeclare the supplied node class, or delete runner-owned input nodes.

## Edge cases

An empty input returns null. With `k = 1`, values stay unchanged. If `k` exceeds the length, the entire input is an incomplete group and stays unchanged. The result must have exactly the input length.

### Representation note

Examples display list values as arrays. For `[1, 2, 3, 4, 5]` and `k = 3`, the result is `[3, 2, 1, 4, 5]`: the last two values are not reversed.
