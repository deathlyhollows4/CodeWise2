# Typed structure harness contract

Status: templates implemented in all3 languages; **five trusted Python helper-only fixtures pass on the bundled host runtime**. Java/C++ templates and all assembled structure wrappers have not been compiled/executed through the isolated runner. These templates unblock draft authoring, not publication. No learner/reference code was run on the Windows host.

Use `buildFunctionHarness` or `materializePack` with typed argument names. New supported input types are `ListNode`, `TreeNode`, `GraphNode`, `IdentityList`. Learners receive actual native nodes, not parsed JSON. Every case gets a new Solution and CwContext. Python classes, Java classes and C++structs expose `val` and appropriate `next`, `random`, `left`, `right`, or `neighbors`; helpers/context own input identity maps. Do not redeclare these supplied node types in starter code.

| Type | Input representation | Return contracts |
|---|---|---|
| ListNode | signed integer values array; sequential next links | `ListNode` serializes finite value chain; `ListNodeIdentity` returns original node index/null by object/pointer lookup |
| IdentityList | `{values,next,heads}` with nullable index links; optional random links | typed `.nodes` and `.heads` preserve aliases/cycles; return original node with `ListNodeIdentity` |
| TreeNode | compact breadth-first nullable integer values, including sparse trees | `TreeNode` serializes tree values; `TreeNodeIdentity` returns the original input-array position of the node/null |
| GraphNode | `{values,neighbors,root}` using adjacency index lists and nullable root | typed native graph; `CloneGraph` serializes rooted BFS graph plus `aliasesOriginal` |
| CloneList | output type only; solution returns native ListNode | rooted BFS(next then random) values/index links plus `aliasesOriginal`; preserve cycles, sharing and duplicate values |

Identity examples: two original nodes both containing7 remain separate index0/index1. Returning the wrong equal-valued node fails an identity result. Returning an original graph/list instead of allocating a clone produces `aliasesOriginal:true`. Returning one collapsed node for two equal-valued nodes changes the serialized topology/count. Trusted fixtures cover these faults, cycles, aliases, sparse trees and invalid tree/list aliasing.

For clone graph tasks, neighbor **order is part of the contract** for these templates, so stable rooted BFS traversal makes reference and clone serialization comparable without using node values as identities. If an authored task allows arbitrary neighbor ordering, add a reviewed graph-isomorphism checker first; do not apply exact ordered serialization to that task. Clone checker/expected result lives outside the learner process and requires both topology and false alias flag. Harness-derived identity bookkeeping does not contain expected answers. As with any function-testing harness sharing an address space with native/interpreted submissions, it is not a cryptographic/proctoring guarantee against a learner deliberately tampering with the harness; containment and expected-output decisions remain outside submitted code.

Define strict nested schemas and reviewed semantic rules:

- Identity table: `{kind:'node-table',field:'data',links:['next','random'],heads:'heads'}` (omit random when absent). Validates equal table lengths, nullable bounded indices, aliases and cycles permitted. Schema object exactly specifies fields; integer-index ranges remain checked before execution.
- Graph table: `{kind:'node-table',field:'data',neighbors:'neighbors',root:'root'}` validates neighbor indices/counts and root. Duplicate neighbor links/self edges are allowed unless task adds a separate rule.
- Tree level: `{kind:'tree-level',field:'values'}` rejects non-null orphan nodes; input array schema uses `trimTrailingNulls:true` so equivalent trailing null representations do not pad unique hidden counts. Empty input and all-null empty-root representations normalize alike.

Example signature: `Solution.solve(data)` receives IdentityList. Java returns ListNode; C++returns ListNode*; Python returns the selected ListNode. Wrapper returns its known original index/null with returnType ListNodeIdentity. The starter explains `.heads` meanings and indexes; the learner never writes an input parser.

Remaining gates: all3 isolated helper/canary fixtures, bounds/calibrated batch memory, C++cleanup of newly allocated result objects, interruption cleanup, and static approved stateful dispatch templates. Stateful class templates are still in progress and must not be represented as available. A source template or helper-only pass does not count as reference validation.
