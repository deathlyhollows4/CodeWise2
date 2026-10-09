import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { checkOutput } from "../../packages/judge-adapter/src/checkers.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 },
  head = { kind: "array", maxLength: 2000, items: integer },
  indexes = {
    kind: "array",
    maxLength: 2000,
    items: { kind: "integer", minimum: 0, maximum: 1999 },
  };
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
function prefixNormal({ head }) {
  const prefix = [0],
    last = new Map([[0, 0]]);
  for (let i = 0; i < head.length; i++) {
    prefix.push(prefix.at(-1) + head[i]);
    last.set(prefix.at(-1), i + 1);
  }
  const out = [];
  let at = 0;
  while (at < head.length) {
    const after = last.get(prefix[at]);
    if (after > at) at = after;
    else out.push(at++);
  }
  return out;
}
function wrappedPrefix({head}) {
  const prefix=[0],last=new Map([[0,0]]);
  for(let i=0;i<head.length;i++){prefix.push((prefix.at(-1)+head[i])|0);last.set(prefix.at(-1),i+1);}
  const out=[];let at=0;
  while(at<head.length){const after=last.get(prefix[at]);if(after>at)at=after;else out.push(at++);}
  return out;
}
function pruneOtherOrder({ head }) {
  const ids = head.map((_, i) => i);
  while (true) {
    let removed = false;
    for (let start = ids.length - 1; start >= 0 && !removed; start--) {
      let sum = 0,
        end = -1;
      for (let i = start; i < ids.length; i++) {
        sum += head[ids[i]];
        if (sum === 0) end = i;
      }
      if (end >= 0) {
        ids.splice(start, end - start + 1);
        removed = true;
      }
    }
    if (!removed) return ids;
  }
}
function zeroCases() {
  const r = seeded(0x1120),
    out = [];
  for (let t = 0; t < 730; t++) {
    const values = Array.from(
      { length: (r() >>> 8) % 28 },
      () => ((r() >>> 8) % 13) - 6,
    );
    out.push({
      input: { head: values },
      category:
        t % 2 ? "overlapping-zero-sum-choices" : "signed-prefix-collisions",
    });
  }
  out.push(
    {
      input: {
        head: [1000000000, 1000000000, 1000000000, 1000000000, 294967296],
      },
      category: "int32-prefix-wrap-is-not-zero",
    },
    {
      input: { head: Array(2000).fill(0) },
      category: "large-whole-chain-zero",
    },
    {
      input: { head: Array.from({ length: 2000 }, (_, i) => (i % 2 ? 1 : -1)) },
      category: "large-overlapping-normalizations",
    },
    {
      input: { head: Array(2000).fill(1000000000) },
      category: "large-wide-prefix-sum-no-removal",
    },
  );
  return out;
}
function balanced({ head, k }) {
  const out = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const size = Math.floor(head.length / k) + (i < head.length % k ? 1 : 0);
    out.push(Array.from({ length: size }, () => at++));
  }
  return out;
}
function distributed({ head, k }) {
  const out = Array.from({ length: k }, () => []),
    q = Math.floor(head.length / k),
    r = head.length % k,
    larger = (q + 1) * r;
  for (let id = 0; id < head.length; id++) {
    const part =
      id < larger
        ? Math.floor(id / (q + 1))
        : r + Math.floor((id - larger) / q);
    out[part].push(id);
  }
  return out;
}
function partCases() {
  const r = seeded(0x1121),
    out = [];
  for (let t = 0; t < 730; t++) {
    const values = Array.from(
        { length: (r() >>> 8) % 40 },
        () => ((r() >>> 8) % 9) - 4,
      ),
      k = 1 + ((r() >>> 8) % 25);
    out.push({
      input: { head: values, k },
      category:
        k > values.length ? "empty-tail-parts" : "balanced-remainder-prefix",
    });
  }
  for (const k of [1, 3, 37, 1999, 2000])
    out.push({
      input: { head: Array(2000).fill(7), k },
      category: "large-equal-valued-original-partition",
    });
  out.push({
    input: { head: [], k: 2000 },
    category: "all-2000-native-heads-null",
  });
  return out;
}
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-normalize-parts.mjs",
  prerequisites: ["list.walk", "list.link-splice", "list.original-identity"],
  remedialIds: ["linked-list-01", "linked-list-03"],
};
export const definitions = [
  {
    ...common,
    id: "linked-list-20",
    slug: "zero-sum-original-list-normalization",
    title: "Remove zero-sum blocks until none remain",
    step: 5,
    skillIds: [
      "list.prefix-equality-unlinking",
      "list.normalized-survivor-invariant",
    ],
    checkpointIds: ["linked-list-11", "linked-list-09"],
    nextIds: [],
    objective:
      "Return an original-node subsequence obtainable by zero-sum block removal, with no zero-sum consecutive block left.",
    rationale:
      "Several legitimate survivor chains can exist. Validate what was removed and the terminal invariant, rather than insisting on one algorithm's witness.",
    statement:
      "## Normalize zero-sum blocks\n\nRepeatedly remove a nonempty consecutive block whose values sum to zero. Stop only when the retained list contains no nonempty zero-sum consecutive block. Return the native head of any valid terminal survivor chain.\n\n## Native identity rules\n\n`solve(head)` receives a finite native ListNode chain with signed values. Nodes expose val and next. You may change next links, but survivors keep their original relative order, identities, and values. Do not substitute copied nodes, change values, delete runner-owned nodes, or redeclare the supplied class. Empty input returns null.\n\n## Multiple valid answers\n\nFor [1,2,-3,3,1], original nodes [3,4] and [0,1,4] are both valid results. The examples show one accepted result; they do not require that exact witness. A zero-valued retained node is itself a removable block and cannot remain.\n\n### Representation note\n\nThe wrapper traverses your returned native chain and displays original node indexes. The checker verifies ordered original survivors, zero-sum removed gaps, and absence of a zero-sum block in the final chain.",
    constraints: [
      "0 ≤ node count ≤ 2,000; values lie in [-1,000,000,000,1,000,000,000].",
      "Each removed block is nonempty and sums to zero.",
      "Survivors retain original order/values/identities and have no zero-sum consecutive block.",
      "The returned native chain must be finite; use a wide prefix-sum accumulator.",
    ],
    interface:
      "Solution.solve(head) returns ListNodeIdentitySequence, checked as a valid zero-sum-list normalization.",
    inputSchema: {
      kind: "object",
      properties: {
        head: {
          ...head,
          items: { kind: "integer", minimum: -1000000000, maximum: 1000000000 },
        },
      },
    },
    outputSchema: indexes,
    checker: { kind: "custom", name: "zero-sum-list-normalization" },
    function: {
      arguments: [{ name: "head", type: "ListNode" }],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [1, 2, -3, 3, 1] },
        expected: [3, 4],
        explanation:
          "Removing the first three nodes is valid; a different valid answer may retain nodes 0, 1 and 4 instead.",
      },
      {
        input: { head: [0, 0] },
        expected: [],
        explanation:
          "The entire zero-sum block can be removed; retaining either zero would not be terminal.",
      },
      {
        input: { head: [2, 5, -1] },
        expected: [0, 1, 2],
        explanation:
          "No nonempty block sums to zero, so every original node remains.",
      },
    ],
    generate: zeroCases,
    oracle: prefixNormal,
    independent: pruneOtherOrder,
    mutations: {
      "leave-original-zero-sum-blocks": ({ head }) => head.map((_, i) => i),
      "remove-nonzero-whole-chain": () => [],
      "int32-prefix-wrap": wrappedPrefix,
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head){ListNode dummy=new ListNode(0,head);HashMap<Long,ListNode> last=new HashMap<>();long sum=0;for(ListNode p=dummy;p!=null;p=p.next){sum+=p.val;last.put(sum,p);}sum=0;for(ListNode p=dummy;p!=null;p=p.next){sum+=p.val;p.next=last.get(sum).next;}return dummy.next;}}",
      "class Solution {public:ListNode* solve(ListNode* head){ListNode dummy(0,head);unordered_map<long long,ListNode*> last;long long sum=0;for(auto p=&dummy;p;p=p->next){sum+=p->val;last[sum]=p;}sum=0;for(auto p=&dummy;p;p=p->next){sum+=p->val;p->next=last.at(sum)->next;}return dummy.next;}};",
      "class Solution:\n    def solve(self, head):\n        dummy=ListNode(0,head)\n        last={}\n        total=0\n        node=dummy\n        while node is not None:\n            total+=node.val\n            last[total]=node\n            node=node.next\n        total=0\n        node=dummy\n        while node is not None:\n            total+=node.val\n            node.next=last[total].next\n            node=node.next\n        return dummy.next\n",
    ),
  },
  {
    ...common,
    id: "linked-list-21",
    slug: "balanced-native-list-parts",
    title: "Split original nodes into balanced consecutive parts",
    step: 4,
    skillIds: ["list.balanced-part-boundaries", "list.native-head-array"],
    checkpointIds: ["linked-list-17", "linked-list-18", "linked-list-19"],
    nextIds: ["linked-list-10"],
    objective:
      "Return k native heads whose disjoint consecutive chains preserve original node order, with earlier parts receiving any remainder.",
    rationale:
      "Each part boundary must be cut physically; merely recording k starting nodes leaves overlapping chains and violates ownership.",
    statement:
      "## Split into k parts\n\nReturn exactly k native list heads. In original order, split the input into consecutive parts whose lengths differ by at most one. Earlier parts receive the extra nodes. Keep every original node once, preserving its value and the original order across the concatenated parts.\n\n## Your function\n\n`solve(head,k)` receives a finite native ListNode and a positive integer. Return ListNode[] in Java, vector<ListNode*> in C++, or a Python list of native heads. Cut each part's final next link so the parts do not overlap. Do not return JSON, copy answer nodes, change original values, delete input nodes, or redeclare the supplied class.\n\n## Empty parts\n\nIf k exceeds the node count, the first n parts contain one node each and the remaining heads are null. Empty input returns k null heads.\n\n### Representation note\n\nThe wrapper displays each part as original node indexes. A null head becomes an empty row. It verifies known original nodes, unchanged values, finite chains, and no original node shared by two parts.",
    constraints: [
      "0 ≤ node count ≤ 2,000; 1 ≤ k ≤ 2,000.",
      "Node values lie in [-1,000,000,1,000,000].",
      "Return exactly k parts, with earlier parts longer when n is not divisible by k.",
      "No original node appears in two parts; concatenating parts restores original node order.",
    ],
    interface:
      "Solution.solve(head,k) returns native head array/list; ListNodeIdentityParts serializes original indexes.",
    inputSchema: {
      kind: "object",
      properties: { head, k: { kind: "integer", minimum: 1, maximum: 2000 } },
    },
    outputSchema: {
      kind: "array",
      minLength: 1,
      maxLength: 2000,
      items: indexes,
    },
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "k", type: "int" },
      ],
      returnType: "ListNodeIdentityParts",
    },
    visible: [
      {
        input: { head: [7, 7, 7, 7, 7, 7, 7], k: 3 },
        expected: [
          [0, 1, 2],
          [3, 4],
          [5, 6],
        ],
        explanation:
          "Seven nodes split as 3, 2 and 2; identities remain stable despite equal values.",
      },
      {
        input: { head: [4, 5], k: 4 },
        expected: [[0], [1], [], []],
        explanation:
          "The two earliest parts have one original node each, then two null heads.",
      },
      {
        input: { head: [], k: 3 },
        expected: [[], [], []],
        explanation: "A null input still requires three null native heads.",
      },
    ],
    generate: partCases,
    oracle: balanced,
    independent: distributed,
    mutations: {
      "put-extra-nodes-in-last-parts": ({ head, k }) => {
        let at = 0;
        return Array.from({ length: k }, (_, i) =>
          Array.from(
            {
              length:
                Math.floor(head.length / k) +
                (i >= k - (head.length % k) ? 1 : 0),
            },
            () => at++,
          ),
        );
      },
      "overlapping-unsevered-parts": ({ head, k }) =>
        balanced({ head, k }).map((row) =>
          row.length ? head.map((_, i) => i).slice(row[0]) : [],
        ),
    },
    languages: refs(
      "class Solution {public ListNode[] solve(ListNode head,int k){int n=0;for(ListNode p=head;p!=null;p=p.next)n++;ListNode[] parts=new ListNode[k];int size=n/k,remainder=n%k;for(int i=0;i<k;i++){parts[i]=head;int count=size+(i<remainder?1:0);for(int j=1;j<count;j++)head=head.next;if(head!=null){ListNode next=head.next;head.next=null;head=next;}}return parts;}}",
      "class Solution {public:vector<ListNode*> solve(ListNode* head,int k){int n=0;for(auto p=head;p;p=p->next)n++;vector<ListNode*> parts(k,nullptr);int size=n/k,remainder=n%k;for(int i=0;i<k;i++){parts[i]=head;int count=size+(i<remainder?1:0);for(int j=1;j<count;j++)head=head->next;if(head){auto next=head->next;head->next=nullptr;head=next;}}return parts;}};",
      "class Solution:\n    def solve(self, head, k):\n        length=0\n        node=head\n        while node is not None:\n            length+=1\n            node=node.next\n        size,remainder=divmod(length,k)\n        parts=[]\n        for i in range(k):\n            parts.append(head)\n            count=size+(1 if i<remainder else 0)\n            for _ in range(1,count):\n                head=head.next\n            if head is not None:\n                following=head.next\n                head.next=None\n                head=following\n        return parts\n",
    ),
  },
];
for (const d of definitions) {
  const starters = buildFunctionStarters(d.function);
  for (const language of ["java", "cpp", "python"])
    d.languages[language].starter = starters[language];
}
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "LL20/21 authored candidates; custom nonunique witnesses validated, no language reference execution",
    prepared: [],
    failures: [],
  };
  for (const d of definitions) {
    const hidden = logicalCases(d),
      checker = d.checker ?? { kind: "exact" };
    for (const c of [...d.visible, ...hidden])
      if (
        !checkOutput(checker, c.expected, d.oracle(c.input), {
          input: c.input,
        }) ||
        !checkOutput(checker, c.expected, d.independent(c.input), {
          input: c.input,
        })
      )
        report.failures.push(d.id + ": invalid oracle witness");
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) =>
          !checkOutput(checker, c.expected, fn(c.input), { input: c.input }),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(d.id + ": mutation " + m.name);
    report.prepared.push({
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-normalize-parts-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-LL-normalize-parts-template-sources.json",
    JSON.stringify(
      definitions.map((d) => ({
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      })),
    ),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("linked-list-normalize-parts.mjs")) audit();
