## Split into k parts

Return exactly k native list heads. In original order, split the input into consecutive parts whose lengths differ by at most one. Earlier parts receive the extra nodes. Keep every original node once, preserving its value and the original order across the concatenated parts.

## Your function

`solve(head,k)` receives a finite native ListNode and a positive integer. Return ListNode[] in Java, vector<ListNode*> in C++, or a Python list of native heads. Cut each part's final next link so the parts do not overlap. Do not return JSON, copy answer nodes, change original values, delete input nodes, or redeclare the supplied class.

## Empty parts

If k exceeds the node count, the first n parts contain one node each and the remaining heads are null. Empty input returns k null heads.

### Representation note

The wrapper displays each part as original node indexes. A null head becomes an empty row. It verifies known original nodes, unchanged values, finite chains, and no original node shared by two parts.
