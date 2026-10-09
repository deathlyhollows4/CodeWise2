## Partition without exchanging identities

Place every original node whose value is less than pivot before every node whose value is at least pivot. Preserve the original order inside each of these two buckets. A value equal to the pivot belongs in the second bucket.

## Native function

`solve(head,pivot)` receives a finite native ListNode head and an integer. A node exposes val and next. Return the relinked native head, or null for empty input. Keep every original node once and preserve its value. Do not substitute new equal-valued nodes, delete input nodes, or redeclare the supplied class.

### Representation note

Expected results are original node indexes. The wrapper checks actual node identity, unchanged values, and a finite result chain; your function returns a native head rather than an index array.
