import {statements} from "./linked-list-prose.mjs";
import { materializePack, seeded, logicalCases } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";

const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const list = { kind: "array", maxLength: 2000, items: integer };
const index = {
  kind: "nullable",
  value: { kind: "integer", minimum: 0, maximum: 1999 },
};
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-first.mjs",
  prerequisites: ["arrays.traversal"],
  step: 1,
};
const language = (
  java,
  cpp,
  python,
  returns = "ListNode",
  args = "ListNode head, int value",
) => ({
  java: {
    starter: `class Solution {\n    public ${returns} solve(${args}) {\n        return null;\n    }\n}\n`,
    reference: java,
  },
  cpp: {
    starter: `class Solution {\npublic:\n    ${returns === "ListNode" ? "ListNode*" : returns} solve(${args.replaceAll("ListNode head", "ListNode* head").replaceAll("IdentityList data", "IdentityList data")}) {\n        return nullptr;\n    }\n};\n`,
    reference: cpp,
  },
  python: {
    starter: `class Solution:\n    def solve(self, ${args.includes("IdentityList") ? "data" : args.includes("int k") ? "head, k" : "head, value"}):\n        return None\n`,
    reference: python,
  },
});
function valueCases(sorted = false) {
  const r = seeded(0x11f1),
    out = [];
  for (let i = 0; i < 720; i++) {
    let head = Array.from({ length: r() % 25 }, () => ((r() >>> 8) % 17) - 8);
    if (sorted) head.sort((a, b) => a - b);
    const value =
      i % 4 === 0 && head.length
        ? head[r() % head.length]
        : ((r() >>> 12) % 23) - 11;
    out.push({
      input: { head, value },
      category:
        i % 4 === 0
          ? "matching-duplicate-value"
          : "signed-values-and-boundaries",
    });
  }
  for (const head of [
    [],
    [0],
    [0, 0, 0],
    [-1000000, 0, 1000000],
    Array.from({ length: 2000 }, (_, i) => i - 1000),
  ])
    for (const value of [-1000000, 0, 1000000])
      out.push({
        input: { head, value },
        category: "empty-singleton-duplicates-and-large",
      });
  return out;
}
const inserted = ({ head, value }) => {
  const result = [...head];
  const at = result.findIndex((x) => x >= value);
  result.splice(at < 0 ? result.length : at, 0, value);
  return result;
};
const removed = ({ head, value }) => head.filter((x) => x !== value);
function kthCases() {
  const r = seeded(0x11f3),
    out = [];
  for (let i = 0; i < 740; i++) {
    const head = Array.from({ length: r() % 30 }, () => ((r() >>> 10) % 7) - 3);
    out.push({
      input: { head, k: 1 + (r() % (head.length + 3)) },
      category: "duplicate-values-identity-gap",
    });
  }
  for (const head of [
    [],
    [7],
    [7, 7, 7],
    Array.from({ length: 2000 }, () => 7),
  ])
    for (const k of [1, 2, 2000, 2001])
      out.push({
        input: { head, k },
        category: "length-edge-and-identical-value-nodes",
      });
  return out;
}
function cycleCases() {
  const r = seeded(0x11f4),
    out = [];
  for (let i = 0; i < 740; i++) {
    const n = 1 + (r() % 30),
      order = Array.from({ length: n }, (_, j) => j);
    for (let j = n - 1; j > 0; j--) {
      const k = (r() >>> 8) % (j + 1);
      [order[j], order[k]] = [order[k], order[j]];
    }
    const values = Array.from({ length: n }, () => ((r() >>> 12) % 7) - 3),
      next = Array(n).fill(null);
    for (let j = 0; j < n - 1; j++) next[order[j]] = order[j + 1];
    if (i % 4 !== 0) next[order[n - 1]] = order[(r() >>> 8) % n];
    out.push({
      input: { data: { values, next, heads: [order[0]] } },
      category:
        i % 4 === 0
          ? "acyclic-permuted-storage"
          : "cycle-with-duplicate-values-and-permuted-storage",
    });
  }
  out.push(
    {
      input: { data: { values: [], next: [], heads: [null] } },
      category: "empty-list",
    },
    {
      input: { data: { values: [9], next: [0], heads: [0] } },
      category: "self-loop",
    },
    {
      input: {
        data: {
          values: Array(2000).fill(7),
          next: Array.from({ length: 2000 }, (_, i) =>
            i === 1999 ? 1250 : i + 1,
          ),
          heads: [0],
        },
      },
      category: "large-tail-before-cycle-identical-values",
    },
  );
  return out;
}
const cycleEntry = ({ data }) => {
  const seen = new Set();
  let at = data.heads[0];
  while (at !== null) {
    if (seen.has(at)) return at;
    seen.add(at);
    at = data.next[at];
  }
  return null;
};
const floyd = ({ data }) => {
  const next = (n) => (n === null ? null : data.next[n]);
  let slow = data.heads[0],
    fast = slow;
  do {
    slow = next(slow);
    fast = next(next(fast));
    if (slow === null || fast === null) return null;
  } while (slow !== fast);
  slow = data.heads[0];
  while (slow !== fast) {
    slow = next(slow);
    fast = next(fast);
  }
  return slow;
};

export const definitions = [
  {
    ...common,
    id: "linked-list-01",
    slug: "splice-into-sorted-native-list",
    title: "Add one value to a sorted native list",
    skillIds: ["list.walk", "list.link-splice"],
    prerequisites: ["arrays.traversal", "sorted.order"],
    checkpointIds: ["linked-list-02"],
    remedialIds: ["two-pointers-04"],
    nextIds: ["linked-list-03"],
    objective:
      "Return a sorted native linked list with exactly one additional occurrence of the supplied value.",
    rationale:
      "A value sequence describes input construction, but the function receives actual node links and must handle changing the head.",
    statement: statements["linked-list-01"],
    constraints: [
      "0 ≤ head.length ≤ 2,000",
      "head is nondecreasing; duplicate and negative values are allowed.",
      "Node values and value lie in [-1,000,000,1,000,000].",
    ],
    interface:
      "Solution.solve(head, value) receives ListNode and int, and returns ListNode.",
    inputSchema: { kind: "object", properties: { head: list, value: integer } },
    outputSchema: { ...list, maxLength: 2001 },
    semanticConstraints: [{ kind: "sorted", field: "head" }],
    valid: ({ head }) => head.every((x, i) => i === 0 || head[i - 1] <= x),
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "value", type: "int" },
      ],
      returnType: "ListNode",
    },
    visible: [
      {
        input: { head: [1, 3, 3, 8], value: 3 },
        expected: [1, 3, 3, 3, 8],
        explanation:
          "The new 3 joins the equal-value run; existing multiplicities are preserved.",
      },
      {
        input: { head: [], value: -2 },
        expected: [-2],
        explanation: "The new node becomes the head.",
      },
      {
        input: { head: [-4, 0, 9], value: 12 },
        expected: [-4, 0, 9, 12],
        explanation: "The new node is linked after the tail.",
      },
    ],
    generate: () => valueCases(true),
    oracle: inserted,
    independent: ({ head, value }) => [...head, value].sort((a, b) => a - b),
    mutations: {
      "append-without-order": ({ head, value }) => [...head, value],
      "drop-equal-value": ({ head, value }) =>
        head.includes(value) ? head : inserted({ head, value }),
    },
    languages: language(
      "class Solution {public ListNode solve(ListNode head,int value){ListNode node=new ListNode(value);if(head==null||value<=head.val){node.next=head;return node;}ListNode p=head;while(p.next!=null&&p.next.val<value)p=p.next;node.next=p.next;p.next=node;return head;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int value){auto node=new ListNode(value);if(!head||value<=head->val){node->next=head;return node;}auto p=head;while(p->next&&p->next->val<value)p=p->next;node->next=p->next;p->next=node;return head;}};",
      "class Solution:\n    def solve(self, head, value):\n        node=ListNode(value)\n        if head is None or value<=head.val:\n            node.next=head\n            return node\n        cursor=head\n        while cursor.next is not None and cursor.next.val<value:\n            cursor=cursor.next\n        node.next=cursor.next\n        cursor.next=node\n        return head\n",
    ),
  },
  {
    ...common,
    id: "linked-list-02",
    slug: "unlink-every-matching-node",
    title: "Remove every matching node",
    skillIds: ["list.walk", "list.unlink"],
    checkpointIds: ["linked-list-01"],
    remedialIds: ["arrays-hashing-01"],
    nextIds: ["linked-list-03"],
    objective:
      "Unlink every matching node, including repeated matches at the head, while preserving the order of remaining values.",
    rationale:
      "Deletion changes links rather than an array length; the first retained node may differ from the supplied head.",
    statement: statements["linked-list-02"],
    constraints: [
      "0 ≤ head.length ≤ 2,000",
      "Values lie in [-1,000,000,1,000,000].",
      "The input is finite and acyclic; duplicate values are allowed.",
    ],
    interface:
      "Solution.solve(head, value) receives ListNode and int, and returns ListNode.",
    inputSchema: { kind: "object", properties: { head: list, value: integer } },
    outputSchema: list,
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "value", type: "int" },
      ],
      returnType: "ListNode",
    },
    visible: [
      {
        input: { head: [2, 2, 1, 2, 3, 2], value: 2 },
        expected: [1, 3],
        explanation: "Both leading matches and the later matches are removed.",
      },
      {
        input: { head: [4, 4], value: 4 },
        expected: [],
        explanation: "No node remains, so the function returns null.",
      },
      {
        input: { head: [-1, 0, -1], value: 8 },
        expected: [-1, 0, -1],
        explanation: "A missing value changes no link.",
      },
    ],
    generate: () => valueCases(false),
    oracle: removed,
    independent: ({ head, value }) => {
      const result = [];
      for (let i = 0; i < head.length; i++)
        if (head[i] !== value) result.push(head[i]);
      return result;
    },
    mutations: {
      "remove-first-match-only": ({ head, value }) => {
        const result = [...head],
          i = result.indexOf(value);
        if (i >= 0) result.splice(i, 1);
        return result;
      },
      "keep-head-unconditionally": ({ head, value }) =>
        head.length
          ? [head[0], ...head.slice(1).filter((x) => x !== value)]
          : [],
    },
    languages: language(
      "class Solution {public ListNode solve(ListNode head,int value){while(head!=null&&head.val==value)head=head.next;ListNode p=head;while(p!=null&&p.next!=null){if(p.next.val==value)p.next=p.next.next;else p=p.next;}return head;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int value){while(head&&head->val==value)head=head->next;auto p=head;while(p&&p->next){if(p->next->val==value)p->next=p->next->next;else p=p->next;}return head;}};",
      "class Solution:\n    def solve(self, head, value):\n        while head is not None and head.val==value:\n            head=head.next\n        cursor=head\n        while cursor is not None and cursor.next is not None:\n            if cursor.next.val==value:\n                cursor.next=cursor.next.next\n            else:\n                cursor=cursor.next\n        return head\n",
    ),
  },
  {
    ...common,
    id: "linked-list-03",
    slug: "kth-from-end-original-node",
    title: "Return the original kth node from the end",
    step: 2,
    skillIds: ["list.fixed-node-gap", "list.original-identity"],
    prerequisites: ["list.walk"],
    checkpointIds: ["linked-list-04"],
    remedialIds: ["linked-list-02"],
    nextIds: [],
    objective:
      "Locate a node with a fixed gap between traversal cursors and return its original identity rather than a copy with an equal value.",
    rationale:
      "Duplicate values make node identity essential; a fixed cursor gap avoids converting the list back into indexed values.",
    statement: statements["linked-list-03"],
    constraints: [
      "0 ≤ head.length ≤ 2,000",
      "1 ≤ k ≤ 2,001",
      "Values lie in [-1,000,000,1,000,000]; values may all be equal.",
    ],
    interface:
      "Solution.solve(head, k) returns an original ListNode or null; the wrapper reports its original index.",
    inputSchema: {
      kind: "object",
      properties: {
        head: list,
        k: { kind: "integer", minimum: 1, maximum: 2001 },
      },
    },
    outputSchema: index,
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "k", type: "int" },
      ],
      returnType: "ListNodeIdentity",
      readOnlyNodes: true,
    },
    visible: [
      {
        input: { head: [7, 7, 7], k: 1 },
        expected: 2,
        explanation:
          "The tail is node2, even though all node values are identical.",
      },
      {
        input: { head: [5, -2, 8, 3], k: 3 },
        expected: 1,
        explanation: "Counting back from node3 gives node1 as the third node.",
      },
      {
        input: { head: [], k: 1 },
        expected: null,
        explanation: "There is no node to select.",
      },
    ],
    generate: kthCases,
    oracle: ({ head, k }) => (head.length < k ? null : head.length - k),
    independent: ({ head, k }) => {
      const reversePositions = [];
      for (let i = 0; i < head.length; i++) reversePositions.unshift(i);
      return reversePositions[k - 1] ?? null;
    },
    mutations: {
      "off-by-one-gap": ({ head, k }) =>
        head.length <= k ? null : head.length - k - 1,
      "equal-value-is-identity": ({ head, k }) =>
        head.length < k ? null : head.indexOf(head[head.length - k]),
    },
    languages: language(
      "class Solution {public ListNode solve(ListNode head,int k){ListNode lead=head;for(int i=0;i<k;i++){if(lead==null)return null;lead=lead.next;}ListNode follow=head;while(lead!=null){lead=lead.next;follow=follow.next;}return follow;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int k){auto lead=head;for(int i=0;i<k;i++){if(!lead)return nullptr;lead=lead->next;}auto follow=head;while(lead){lead=lead->next;follow=follow->next;}return follow;}};",
      "class Solution:\n    def solve(self, head, k):\n        lead=head\n        for _ in range(k):\n            if lead is None:\n                return None\n            lead=lead.next\n        follow=head\n        while lead is not None:\n            lead=lead.next\n            follow=follow.next\n        return follow\n",
      "ListNode",
      "ListNode head, int k",
    ),
  },
  {
    ...common,
    id: "linked-list-04",
    slug: "cycle-entry-original-node",
    title: "Find where the cycle begins",
    step: 2,
    skillIds: [
      "list.cycle-meeting",
      "list.cycle-entry",
      "list.original-identity",
    ],
    prerequisites: ["list.walk"],
    checkpointIds: ["linked-list-03"],
    remedialIds: ["linked-list-02"],
    nextIds: [],
    objective:
      "Distinguish a cycle meeting point from its entry and return the exact original entry node.",
    rationale:
      "Two traversal speeds reveal a cycle; resetting one cursor identifies its entry. Equal-valued nodes and permuted storage prevent value/index shortcuts.",
    statement: statements["linked-list-04"],
    constraints: [
      "0 ≤ data.values.length ≤ 2,000",
      "next has one nullable bounded node index per value; heads contains exactly one nullable bounded index.",
      "All nodes are reachable from the single head; the links may form a cycle.",
      "Values lie in [-1,000,000,1,000,000] and may all be equal.",
    ],
    interface:
      "Solution.solve(data) receives IdentityList and returns an original ListNode or null.",
    inputSchema: {
      kind: "object",
      properties: {
        data: {
          kind: "object",
          properties: {
            values: list,
            next: { kind: "array", maxLength: 2000, items: index },
            heads: { kind: "array", minLength: 1, maxLength: 1, items: index },
          },
        },
      },
    },
    outputSchema: index,
    semanticConstraints: [
      {
        kind: "node-table",
        field: "data",
        links: ["next"],
        heads: "heads",
        requireReachable: true,
      },
    ],
    function: {
      arguments: [{ name: "data", type: "IdentityList" }],
      returnType: "ListNodeIdentity",
      readOnlyNodes: true,
    },
    visible: [
      {
        input: {
          data: { values: [7, 7, 7, 7], next: [1, 2, 3, 1], heads: [0] },
        },
        expected: 1,
        explanation:
          "Traversal first repeats node1. Equal values cannot locate the entry.",
      },
      {
        input: { data: { values: [4, -2, 8], next: [null, 2, 0], heads: [1] } },
        expected: null,
        explanation: "The permuted traversal1→2→0 ends at null.",
      },
      {
        input: { data: { values: [9], next: [0], heads: [0] } },
        expected: 0,
        explanation: "A self-loop begins at its only node.",
      },
    ],
    generate: cycleCases,
    oracle: cycleEntry,
    independent: floyd,
    mutations: {
      "return-meeting-without-reset": ({ data }) => {
        let a = data.heads[0],
          b = a;
        const next = (n) => (n === null ? null : data.next[n]);
        for (let i = 0; i <= data.values.length; i++) {
          a = next(a);
          b = next(next(b));
          if (a === null || b === null) return null;
          if (a === b) return a;
        }
        return null;
      },
      "first-equal-value-node": (input) => {
        const at = cycleEntry(input);
        return at === null
          ? null
          : input.data.values.indexOf(input.data.values[at]);
      },
    },
    languages: language(
      "class Solution {public ListNode solve(IdentityList data){ListNode head=data.heads[0],slow=head,fast=head;while(fast!=null&&fast.next!=null){slow=slow.next;fast=fast.next.next;if(slow==fast){slow=head;while(slow!=fast){slow=slow.next;fast=fast.next;}return slow;}}return null;}}",
      "class Solution {public:ListNode* solve(IdentityList data){auto head=data.heads[0];auto slow=head;auto fast=head;while(fast&&fast->next){slow=slow->next;fast=fast->next->next;if(slow==fast){slow=head;while(slow!=fast){slow=slow->next;fast=fast->next;}return slow;}}return nullptr;}};",
      "class Solution:\n    def solve(self, data):\n        head=data.heads[0]\n        slow=fast=head\n        while fast is not None and fast.next is not None:\n            slow=slow.next\n            fast=fast.next.next\n            if slow is fast:\n                slow=head\n                while slow is not fast:\n                    slow=slow.next\n                    fast=fast.next\n                return slow\n        return None\n",
      "ListNode",
      "IdentityList data",
    ),
  },
];

// R21: explicit one-step progression targets now exist in the materialized bank.
definitions.find(def => def.id === 'linked-list-03').nextIds = ["linked-list-05"];
definitions.find(def => def.id === 'linked-list-04').nextIds = ["linked-list-06"];

export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope: "first four linked-list authored drafts; trusted JS oracles only",
    referenceRuntime: "not-run",
    published: 0,
    packs: [],
    failures: [],
  };
  for (const def of definitions) {
    const hidden = logicalCases(def);
    for (const c of [...def.visible, ...hidden])
      if (
        JSON.stringify(def.oracle(c.input)) !==
        JSON.stringify(def.independent(c.input))
      )
        report.failures.push(def.id + ": oracle mismatch");
    const mutations = Object.entries(def.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected)
        report.failures.push(def.id + ": live mutation " + m.name);
    report.packs.push({
      id: def.id,
      hidden: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-first-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
  return report;
}
if (process.argv[1]?.endsWith("linked-list-first.mjs")) {
  for (const def of definitions) console.log(await materializePack(def));
  console.log(audit());
}
