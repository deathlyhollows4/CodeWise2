import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function depthFirst({ head }, breadth = false, ignoreChild = false) {
  const out = [],
    work = head.head === null ? [] : [head.head];
  while (work.length) {
    const at = breadth ? work.shift() : work.pop();
    out.push(at);
    if (head.next[at] !== null) work.push(head.next[at]);
    if (!ignoreChild && head.child[at] !== null) work.push(head.child[at]);
  }
  return out;
}
function spliceModel({ head }) {
  const next = [...head.next],
    child = [...head.child],
    out = [];
  let at = head.head;
  while (at !== null) {
    out.push(at);
    if (child[at] !== null) {
      let tail = child[at];
      while (next[tail] !== null) tail = next[tail];
      next[tail] = next[at];
      next[at] = child[at];
      child[at] = null;
    }
    at = next[at];
  }
  return out;
}
function cases() {
  const random = seeded(0x221ced),
    out = [];
  for (let test = 0; test < 740; test++) {
    const n = 1 + (random() % 60),
      values = Array.from({ length: n }, () => (random() % 41) - 20),
      next = Array(n).fill(null),
      child = Array(n).fill(null),
      slots = [
        { from: 0, kind: "next" },
        { from: 0, kind: "child" },
      ];
    for (let node = 1; node < n; node++) {
      const at = random() % slots.length,
        slot = slots.splice(at, 1)[0];
      (slot.kind === "next" ? next : child)[slot.from] = node;
      slots.push({ from: node, kind: "next" }, { from: node, kind: "child" });
    }
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = random() % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const data = {
      values: Array(n),
      next: Array(n),
      child: Array(n),
      head: order[0],
    };
    for (let i = 0; i < n; i++) {
      const at = order[i];
      data.values[at] = values[i];
      data.next[at] = next[i] === null ? null : order[next[i]];
      data.child[at] = child[i] === null ? null : order[child[i]];
    }
    out.push({
      input: { head: data },
      category: "permuted-native-multilevel-branches",
    });
  }
  for (const kind of ["next", "child"]) {
    const data = {
      values: Array.from({ length: 2000 }, (_, i) =>
        i % 2 ? 1000000000 : -1000000000,
      ),
      next: Array(2000).fill(null),
      child: Array(2000).fill(null),
      head: 0,
    };
    for (let i = 0; i < 1999; i++) data[kind][i] = i + 1;
    out.push({ input: { head: data }, category: "maximum-" + kind + "-depth" });
  }
  const siblings = {
    values: Array(2000).fill(7),
    next: Array(2000).fill(null),
    child: Array(2000).fill(null),
    head: 0,
  };
  siblings.child[0] = 1;
  siblings.next[0] = 1001;
  for (let i = 1; i < 1000; i++) siblings.next[i] = i + 1;
  for (let i = 1001; i < 1999; i++) siblings.next[i] = i + 1;
  out.push({
    input: { head: siblings },
    category: "long-child-chain-before-deferred-siblings",
  });
  out.push({
    input: { head: { values: [], next: [], child: [], head: null } },
    category: "empty-native-head",
  });
  return out;
}
const index = {
    kind: "nullable",
    value: { kind: "integer", minimum: 0, maximum: 1999 },
  },
  indexes = { kind: "array", maxLength: 2000, items: index };
const d = {
  id: "linked-list-22",
  slug: "flatten-genuine-multilevel-doubly-linked-list",
  title: "Flatten every child list before its next sibling",
  primaryTopic: "linked-list",
  step: 5,
  skillIds: [
    "list.walk",
    "list.link-splice",
    "list.original-identity",
    "list.multilevel-depthfirst",
    "list.bidirectional-flatten",
  ],
  prerequisites: ["list.walk", "list.link-splice", "list.original-identity"],
  remedialIds: ["linked-list-01", "linked-list-03"],
  checkpointIds: [
    "linked-list-09",
    "linked-list-10",
    "linked-list-11",
    "linked-list-12",
    "linked-list-20",
  ],
  nextIds: [],
  objective:
    "Flatten original multilevel native nodes in node/child/next order, clearing child fields and making a valid reciprocal doubly linked chain.",
  rationale:
    "Deferred next siblings resume after an entire child sublist; identity, unchanged values and reciprocal previous links are part of the result, not merely a copied value sequence.",
  statement:
    "## Flatten the original multilevel nodes\n\nEach native MultiListNode has `val`, `next`, `prev`, and `child`. next/prev connect siblings; child points to the head of a nested list. Return the original head after flattening all nodes into one doubly linked chain in depth-first order: visit a node, then its complete child list, then its next sibling. A child list may itself contain nested children.\n\nUse every original node exactly once and preserve every value. Relink the existing objects; do not return copied nodes or integer IDs. In the final chain every child field is null, head.prev is null, the last next is null, and each next/prev pair is reciprocal. An empty head returns null.\n\nThe input has no cycles, shared nodes, or disconnected nodes. A child head has prev=null. Root head.prev is null, and sibling next/prev links are consistent.\n\n`solve(head)` receives the genuine MultiListNode head. The runner supplies the class and constructs the links; do not redeclare it or write a parser.\n\n### Representation and identity notes\n\nExample input tables identify original objects by row index: values contains val fields; next/child entries are a row index or null; head selects the root row. The runner derives prev from sibling next links. Output arrays display original row indices in flattened order, but your return value must be the native head object. The checker also validates cleared child fields, unchanged values and reciprocal previous links.",
  constraints: [
    "0 to 2,000 original nodes.",
    "Values lie in [-1,000,000,000,1,000,000,000]; values may repeat.",
    "All next/child targets are valid original nodes; each non-root node has exactly one incoming next or child link.",
    "All nodes are reachable from head through next/child, with no cycle.",
    "The result must reuse the original nodes and preserve values while repairing next/prev and clearing child.",
  ],
  interface:
    "Solution.solve(head) receives MultiListNode and returns the original flattened MultiListNode head.",
  inputSchema: {
    kind: "object",
    properties: {
      head: {
        kind: "object",
        properties: {
          values: {
            kind: "array",
            maxLength: 2000,
            items: {
              kind: "integer",
              minimum: -1000000000,
              maximum: 1000000000,
            },
          },
          next: indexes,
          child: indexes,
          head: index,
        },
      },
    },
  },
  semanticConstraints: [
    { kind: "multilevel-list", field: "head", maxNodes: 2000 },
  ],
  outputSchema: {
    kind: "array",
    maxLength: 2000,
    items: { kind: "integer", minimum: 0, maximum: 1999 },
  },
  function: {
    arguments: [{ name: "head", type: "MultiListNode" }],
    returnType: "MultiListNodeIdentitySequence",
  },
  generatorModule: "content/authoring/linked-list-multilevel.mjs",
  visible: [
    {
      input: {
        head: {
          values: [10, 20, 30, 40],
          next: [1, 2, null, null],
          child: [3, null, null, null],
          head: 0,
        },
      },
      expected: [0, 3, 1, 2],
      explanation:
        "Visit original head 0, its child 3, then deferred next siblings 1 and 2. Repair prev links and clear every child.",
    },
    {
      input: {
        head: {
          values: [7, 7, 7, 7, 7],
          next: [3, null, 4, null, null],
          child: [null, null, 0, null, 1],
          head: 2,
        },
      },
      expected: [2, 0, 3, 4, 1],
      explanation:
        "All values match, so identity matters: root 2 visits child 0 and its next 3 before next 4 and child 1.",
    },
    {
      input: { head: { values: [], next: [], child: [], head: null } },
      expected: [],
      explanation: "A null native head has no original node to flatten.",
    },
  ],
  generate: cases,
  valid: (input) => validateSemantics(d.semanticConstraints, input),
  oracle: depthFirst,
  independent: spliceModel,
  mutations: {
    "breadth-first-instead-of-child-first": (input) => depthFirst(input, true),
    "ignore-all-child-lists": (input) => depthFirst(input, false, true),
    "copy-values-instead-of-original-identities": (input) =>
      depthFirst(input).map((index) => input.head.values[index]),
  },
  languages: {
    java: {
      starter: "GENERATE",
      reference:
        "class Solution {public MultiListNode solve(MultiListNode head){if(head==null)return null;ArrayDeque<MultiListNode> stack=new ArrayDeque<>();stack.push(head);MultiListNode previous=null;while(!stack.isEmpty()){MultiListNode node=stack.pop();if(node.next!=null)stack.push(node.next);if(node.child!=null)stack.push(node.child);node.next=null;node.child=null;node.prev=previous;if(previous!=null)previous.next=node;previous=node;}return head;}}",
    },
    cpp: {
      starter: "GENERATE",
      reference:
        "class Solution {public:MultiListNode* solve(MultiListNode* head){if(!head)return nullptr;vector<MultiListNode*> stack{head};MultiListNode* previous=nullptr;while(!stack.empty()){auto node=stack.back();stack.pop_back();if(node->next)stack.push_back(node->next);if(node->child)stack.push_back(node->child);node->next=nullptr;node->child=nullptr;node->prev=previous;if(previous)previous->next=node;previous=node;}return head;}};",
    },
    python: {
      starter: "GENERATE",
      reference:
        "class Solution:\n    def solve(self, head):\n        if head is None:\n            return None\n        stack=[head]\n        previous=None\n        while stack:\n            node=stack.pop()\n            if node.next is not None:\n                stack.append(node.next)\n            if node.child is not None:\n                stack.append(node.child)\n            node.next=None\n            node.child=None\n            node.prev=previous\n            if previous is not None:\n                previous.next=node\n            previous=node\n        return head\n",
    },
  },
};
export const definitions = [d];
const starters = buildFunctionStarters(d.function);
for (const language of ["java", "cpp", "python"])
  d.languages[language].starter = starters[language];
export function audit() {
  const hidden = logicalCases(d),
    report = {
      timestamp: new Date().toISOString(),
      scope:
        "LL22 source-only author/model audit; native helper enforcement/execution remains separate",
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations: [],
      failures: [],
    };
  for (const c of [...d.visible, ...hidden]) {
    const result = d.oracle(c.input);
    if (!d.valid(c.input)) report.failures.push("semantic invalid");
    if (JSON.stringify(result) !== JSON.stringify(d.independent(c.input)))
      report.failures.push("independent mismatch");
    if (
      c.expected !== undefined &&
      JSON.stringify(result) !== JSON.stringify(c.expected)
    )
      report.failures.push("expected mismatch");
  }
  report.mutations = Object.entries(d.mutations).map(([name, fn]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
    ),
  }));
  for (const m of report.mutations)
    if (!m.detected) report.failures.push("mutation " + m.name);
  writeFileSync(
    "docs/release-evidence/content-LL-multilevel-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-LL-multilevel-template-sources.json",
    JSON.stringify([
      {
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      },
    ]),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("linked-list-multilevel.mjs")) audit();
