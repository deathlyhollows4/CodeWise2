import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 },
  head = { kind: "array", maxLength: 2000, items: integer };
const indexes = {
  kind: "array",
  maxLength: 2000,
  items: { kind: "integer", minimum: 0, maximum: 1999 },
};
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-relink.mjs",
  step: 4,
  prerequisites: ["list.walk", "list.link-splice", "list.original-identity"],
  remedialIds: ["linked-list-01", "linked-list-03"],
  outputSchema: indexes,
};
function movedArray({ head, cutIds, afterIds }, positions = false) {
  const order = head.map((_, i) => i);
  for (let i = 0; i < cutIds.length; i++) {
    let cut = cutIds[i],
      after = afterIds[i];
    if (positions) {
      cut = order[cutIds[i]];
      after = after < 0 ? -1 : order[after];
    }
    if (cut === after) continue;
    order.splice(order.indexOf(cut), 1);
    const at = after < 0 ? 0 : order.indexOf(after) + 1;
    order.splice(at, 0, cut);
  }
  return order;
}
function movedLinks({ head, cutIds, afterIds }) {
  const nodes = head.map((_, id) => ({ id, prev: null, next: null }));
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].prev = nodes[i - 1] ?? null;
    nodes[i].next = nodes[i + 1] ?? null;
  }
  let first = nodes[0] ?? null;
  for (let i = 0; i < cutIds.length; i++) {
    const node = nodes[cutIds[i]],
      after = afterIds[i] < 0 ? null : nodes[afterIds[i]];
    if (node === after) continue;
    if (node.prev) node.prev.next = node.next;
    else first = node.next;
    if (node.next) node.next.prev = node.prev;
    if (!after) {
      node.prev = null;
      node.next = first;
      if (first) first.prev = node;
      first = node;
    } else {
      node.next = after.next;
      node.prev = after;
      if (after.next) after.next.prev = node;
      after.next = node;
    }
  }
  const out = [];
  while (first) {
    out.push(first.id);
    first = first.next;
  }
  return out;
}
function moveCases() {
  const r = seeded(0x1117),
    out = [];
  for (let t = 0; t < 720; t++) {
    const n = (r() >>> 8) % 30,
      m = n ? (r() >>> 8) % 60 : 0,
      values = Array.from({ length: n }, () => ((r() >>> 8) % 7) - 3),
      cutIds = [],
      afterIds = [];
    for (let i = 0; i < m; i++) {
      cutIds.push((r() >>> 8) % n);
      afterIds.push(((r() >>> 8) % (n + 1)) - 1);
    }
    out.push({
      input: { head: values, cutIds, afterIds },
      category:
        t % 2
          ? "original-identity-survives-repeated-moves"
          : "front-tail-self-and-adjacent-moves",
    });
  }
  out.push({
    input: {
      head: Array(2000).fill(7),
      cutIds: Array.from({ length: 2000 }, (_, i) => i),
      afterIds: Array(2000).fill(-1),
    },
    category: "large-history-equal-valued-originals",
  });
  return out;
}
const rotated = ({ head, k }) => {
  if (!head.length) return [];
  const amount = k % head.length,
    start = (head.length - amount) % head.length;
  return Array.from(
    { length: head.length },
    (_, i) => (start + i) % head.length,
  );
};
const rotatedQueue = ({ head, k }) => {
  const out = head.map((_, i) => i);
  if (out.length)
    for (let i = 0; i < k % out.length; i++) out.unshift(out.pop());
  return out;
};
function rotateCases() {
  const r = seeded(0x1118),
    out = [];
  for (let t = 0; t < 720; t++) {
    const values = Array.from(
        { length: (r() >>> 8) % 35 },
        () => ((r() >>> 8) % 9) - 4,
      ),
      k = t % 7 === 0 ? 1000000000 : (r() >>> 8) % 100;
    out.push({
      input: { head: values, k },
      category: t % 7 ? "modulo-right-rotation" : "large-count-wraps",
    });
  }
  out.push({
    input: {
      head: Array.from({ length: 2000 }, (_, i) => i % 5),
      k: 1000000000,
    },
    category: "large-chain-and-exact-multiple",
  });
  out.push({input:{head:Array.from({length:2000},(_,i)=>i%5),k:999999999},category:'large-chain-nonzero-modulo-reconnect'});
  return out;
}
const reversedRange = ({ head, left, right }) =>
  head
    .map((_, i) => i)
    .slice(0, left)
    .concat(
      Array.from({ length: right - left + 1 }, (_, i) => right - i),
      head.map((_, i) => i).slice(right + 1),
    );
const rangeSwaps = ({ head, left, right }) => {
  const out = head.map((_, i) => i);
  while (left < right) {
    [out[left], out[right]] = [out[right], out[left]];
    left++;
    right--;
  }
  return out;
};
function rangeCases() {
  const r = seeded(0x1119),
    out = [];
  for (let t = 0; t < 720; t++) {
    const n = 1 + ((r() >>> 8) % 35),
      values = Array.from({ length: n }, () => ((r() >>> 8) % 9) - 4),
      a = (r() >>> 8) % n,
      b = (r() >>> 8) % n;
    out.push({
      input: { head: values, left: Math.min(a, b), right: Math.max(a, b) },
      category:
        t % 2
          ? "interior-interval-preserves-outer-links"
          : "head-tail-singleton-ranges",
    });
  }
  out.push({
    input: { head: Array(2000).fill(7), left: 1, right: 1998 },
    category: "large-equal-values-interior-identity-reversal",
  });
  return out;
}
const note =
  "## Native ownership\n\nThe function receives a real ListNode head. Nodes expose val and next; the supplied class and parser are handled by the runner. Preserve original values and return a finite chain using each original node once. Do not substitute copied nodes or delete runner-owned nodes.\n\n### Representation note\n\nThe displayed output is the original-node index sequence. Those indexes refer to the initial input traversal and are checked through actual object/pointer identity, not equal values. Your function returns a native node, not an index array.";
export const definitions = [
  {
    ...common,
    id: "linked-list-17",
    slug: "original-node-cut-and-insert-history",
    title: "Move identified original nodes through a history",
    skillIds: [
      "list.stable-addressed-node-moves",
      "list.predecessor-maintenance",
    ],
    checkpointIds: ["linked-list-18", "linked-list-19", "linked-list-15"],
    nextIds: ["linked-list-10"],
    objective:
      "Apply cut-and-insert operations addressed by immutable original node indexes, rather than changing current positions or values.",
    rationale:
      "A node keeps its original identifier after moving; detach its current predecessor link before connecting it at the new location.",
    statement:
      "## Apply the moves\n\nInitially, node indexes follow the input list from 0 onward. For each operation, cut the node identified by cutIds[i] from its current location and insert it immediately after the original node identified by afterIds[i]. An after identifier of -1 means insert at the front. If both identifiers name the same node, leave the list unchanged. Every node keeps its original identifier through every move.\n\n`solve(head,cutIds,afterIds)` receives a native head and two equally long integer arrays. Return the final native head. The list may be empty only when the operation arrays are empty. Moving an already-front node to the front, adjacent moves and repeated moves are allowed. Aim for O(n + m) work with original-node lookup and maintained predecessor links.\n\n" +
      note,
    constraints: [
      "0 ≤ node count and operation count ≤ 2,000.",
      "Node values lie in [-1,000,000,1,000,000]; duplicates do not merge identities.",
      "cutIds and afterIds have equal lengths.",
      "Every cut identifier lies in [0,n-1]; every after identifier lies in [-1,n-1].",
    ],
    interface:
      "Solution.solve(head,cutIds,afterIds) returns ListNodeIdentitySequence.",
    inputSchema: {
      kind: "object",
      properties: {
        head,
        cutIds: indexes,
        afterIds: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "integer", minimum: -1, maximum: 1999 },
        },
      },
    },
    semanticConstraints: [
      { kind: "lengths-equal", left: "cutIds", right: "afterIds" },
      {
        kind: "range-by-length",
        field: "cutIds",
        array: "head",
        minimum: 0,
        maxOffset: -1,
      },
      {
        kind: "range-by-length",
        field: "afterIds",
        array: "head",
        minimum: -1,
        maxOffset: -1,
      },
    ],
    valid: ({ head, cutIds, afterIds }) =>
      cutIds.length === afterIds.length &&
      cutIds.every((id) => id >= 0 && id < head.length) &&
      afterIds.every((id) => id >= -1 && id < head.length),
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "cutIds", type: "int[]" },
        { name: "afterIds", type: "int[]" },
      ],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [7, 7, 7, 7], cutIds: [3, 1], afterIds: [-1, 3] },
        expected: [3, 1, 0, 2],
        explanation:
          "Node 3 moves to the front, then original node 1 moves after it; identifiers do not change with positions.",
      },
      {
        input: { head: [4, 5], cutIds: [0, 0], afterIds: [0, -1] },
        expected: [0, 1],
        explanation:
          "A self move does nothing, and moving the current front to the front also changes nothing.",
      },
      {
        input: { head: [], cutIds: [], afterIds: [] },
        expected: [],
        explanation: "An empty input with no operations returns null.",
      },
    ],
    generate: moveCases,
    oracle: movedArray,
    independent: movedLinks,
    mutations: {
      "interpret-identifiers-as-current-positions": (input) =>
        movedArray(input, true),
      "ignore-all-moves": ({ head }) => head.map((_, i) => i),
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head,int[] cutIds,int[] afterIds){ArrayList<ListNode> nodes=new ArrayList<>();IdentityHashMap<ListNode,ListNode> prev=new IdentityHashMap<>();ListNode before=null;for(ListNode p=head;p!=null;p=p.next){nodes.add(p);prev.put(p,before);before=p;}for(int i=0;i<cutIds.length;i++){ListNode node=nodes.get(cutIds[i]),after=afterIds[i]<0?null:nodes.get(afterIds[i]);if(node==after)continue;ListNode p=prev.get(node),next=node.next;if(p==null)head=next;else p.next=next;if(next!=null)prev.put(next,p);if(after==null){node.next=head;prev.put(node,null);if(head!=null)prev.put(head,node);head=node;}else{node.next=after.next;after.next=node;prev.put(node,after);if(node.next!=null)prev.put(node.next,node);}}return head;}}",
      "class Solution {public:ListNode* solve(ListNode* head,vector<int> cutIds,vector<int> afterIds){vector<ListNode*> nodes;unordered_map<ListNode*,ListNode*> prev;ListNode* before=nullptr;for(auto p=head;p;p=p->next){nodes.push_back(p);prev[p]=before;before=p;}for(size_t i=0;i<cutIds.size();i++){auto node=nodes.at(cutIds[i]);auto after=afterIds[i]<0?nullptr:nodes.at(afterIds[i]);if(node==after)continue;auto p=prev.at(node);auto next=node->next;if(p)p->next=next;else head=next;if(next)prev[next]=p;if(!after){node->next=head;prev[node]=nullptr;if(head)prev[head]=node;head=node;}else{node->next=after->next;after->next=node;prev[node]=after;if(node->next)prev[node->next]=node;}}return head;}};",
      "class Solution:\n    def solve(self, head, cutIds, afterIds):\n        nodes=[]\n        previous={}\n        before=None\n        cursor=head\n        while cursor is not None:\n            nodes.append(cursor)\n            previous[cursor]=before\n            before=cursor\n            cursor=cursor.next\n        for cut,after_id in zip(cutIds,afterIds):\n            node=nodes[cut]\n            after=None if after_id<0 else nodes[after_id]\n            if node is after:\n                continue\n            before=previous[node]\n            following=node.next\n            if before is None:\n                head=following\n            else:\n                before.next=following\n            if following is not None:\n                previous[following]=before\n            if after is None:\n                node.next=head\n                previous[node]=None\n                if head is not None:\n                    previous[head]=node\n                head=node\n            else:\n                node.next=after.next\n                after.next=node\n                previous[node]=after\n                if node.next is not None:\n                    previous[node.next]=node\n        return head\n",
    ),
  },
  {
    ...common,
    id: "linked-list-18",
    slug: "rotate-original-node-chain-right",
    title: "Rotate the original chain to the right",
    skillIds: ["list.modular-cut-point", "list.close-and-break-ring"],
    checkpointIds: ["linked-list-17", "linked-list-19", "linked-list-08"],
    nextIds: ["linked-list-10"],
    objective:
      "Move a suffix to the front using a modular cut point while preserving all original node identities and values.",
    rationale:
      "The rotation count may greatly exceed the length; locate the new tail after reducing it modulo n, and break the temporary ring.",
    statement:
      "## Rotate to the right\n\nMove the last k nodes to the front, preserving their order and the order of the remaining prefix. Counts greater than the list length wrap modulo that length. A zero count leaves the list unchanged, and an empty input returns null.\n\n`solve(head,k)` receives the native head and a nonnegative integer. Return the new native head. The returned chain must be finite: if you temporarily close a ring, break it at the new tail.\n\n" +
      note,
    constraints: [
      "0 ≤ node count ≤ 2,000; 0 ≤ k ≤ 1,000,000,000.",
      "Values lie in [-1,000,000,1,000,000].",
      "Preserve original values, identities, and the relative order inside the moved suffix and retained prefix.",
    ],
    interface: "Solution.solve(head,k) returns ListNodeIdentitySequence.",
    inputSchema: {
      kind: "object",
      properties: {
        head,
        k: { kind: "integer", minimum: 0, maximum: 1000000000 },
      },
    },
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "k", type: "int" },
      ],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [9, 9, 9, 9, 9], k: 2 },
        expected: [3, 4, 0, 1, 2],
        explanation:
          "The final two original nodes become the first two, despite equal values.",
      },
      {
        input: { head: [1, 2, 3], k: 6 },
        expected: [0, 1, 2],
        explanation: "Two complete rotations leave the chain unchanged.",
      },
      {
        input: { head: [], k: 1000000000 },
        expected: [],
        explanation: "Do not take a modulo by zero for empty input.",
      },
    ],
    generate: rotateCases,
    oracle: rotated,
    independent: rotatedQueue,
    mutations: {
      "rotate-left-instead": ({ head, k }) => {
        if (!head.length) return [];
        const amount = k % head.length;
        return head.map((_, i) => (i + amount) % head.length);
      },
      "omit-modulo-reduction": ({ head, k }) =>
        k > head.length ? head.map((_, i) => i) : rotated({ head, k }),
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head,int k){if(head==null)return null;int n=1;ListNode tail=head;while(tail.next!=null){tail=tail.next;n++;}int amount=k%n;if(amount==0)return head;ListNode newTail=head;for(int i=0;i<n-amount-1;i++)newTail=newTail.next;ListNode newHead=newTail.next;tail.next=head;newTail.next=null;return newHead;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int k){if(!head)return nullptr;int n=1;auto tail=head;while(tail->next){tail=tail->next;n++;}int amount=k%n;if(amount==0)return head;auto newTail=head;for(int i=0;i<n-amount-1;i++)newTail=newTail->next;auto newHead=newTail->next;tail->next=head;newTail->next=nullptr;return newHead;}};",
      "class Solution:\n    def solve(self, head, k):\n        if head is None:\n            return None\n        tail=head\n        length=1\n        while tail.next is not None:\n            tail=tail.next\n            length+=1\n        amount=k%length\n        if amount==0:\n            return head\n        new_tail=head\n        for _ in range(length-amount-1):\n            new_tail=new_tail.next\n        new_head=new_tail.next\n        tail.next=head\n        new_tail.next=None\n        return new_head\n",
    ),
  },
  {
    ...common,
    id: "linked-list-19",
    slug: "reverse-one-original-node-interval",
    title: "Reverse one interval of original nodes",
    skillIds: ["list.interval-predecessor", "list.three-chain-reconnection"],
    checkpointIds: ["linked-list-17", "linked-list-18", "linked-list-08"],
    nextIds: ["linked-list-10"],
    objective:
      "Reverse one inclusive interval while preserving the prefix and suffix and returning the correct original head.",
    rationale:
      "Track the interval predecessor and its old first node; they become the reconnect points after reversal.",
    statement:
      "## Reverse one interval\n\nReverse the original nodes from zero-based position left through right, inclusive. Keep all nodes before and after that interval in their original order. If left equals right, leave the chain unchanged.\n\n`solve(head,left,right)` receives a nonempty native list and valid positions with left ≤ right. Return the resulting native head. Reversing an interval starting at position 0 may change the head.\n\n" +
      note,
    constraints: [
      "1 ≤ node count ≤ 2,000.",
      "0 ≤ left ≤ right < node count.",
      "Node values lie in [-1,000,000,1,000,000]; equal-valued nodes remain separate identities.",
      "Preserve the prefix/suffix order and every original value.",
    ],
    interface:
      "Solution.solve(head,left,right) returns ListNodeIdentitySequence.",
    inputSchema: {
      kind: "object",
      properties: {
        head: { ...head, minLength: 1 },
        left: { kind: "integer", minimum: 0, maximum: 1999 },
        right: { kind: "integer", minimum: 0, maximum: 1999 },
      },
    },
    semanticConstraints: [
      { kind: "field-order", lower: "left", upper: "right" },
      {
        kind: "length-relative",
        field: "left",
        array: "head",
        minimum: 0,
        maxOffset: -1,
      },
      {
        kind: "length-relative",
        field: "right",
        array: "head",
        minimum: 0,
        maxOffset: -1,
      },
    ],
    valid: ({ head, left, right }) => left <= right && right < head.length,
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "left", type: "int" },
        { name: "right", type: "int" },
      ],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [7, 7, 7, 7, 7], left: 1, right: 3 },
        expected: [0, 3, 2, 1, 4],
        explanation:
          "Only original nodes 1 through 3 reverse; outer nodes stay fixed.",
      },
      {
        input: { head: [4, 5, 6], left: 0, right: 2 },
        expected: [2, 1, 0],
        explanation: "Reversing the full interval changes the original head.",
      },
      {
        input: { head: [8], left: 0, right: 0 },
        expected: [0],
        explanation: "A one-node interval changes no link.",
      },
    ],
    generate: rangeCases,
    oracle: reversedRange,
    independent: rangeSwaps,
    mutations: {
      "reverse-entire-list": ({ head }) =>
        head.map((_, i) => head.length - 1 - i),
      "right-bound-exclusive": ({ head, left, right }) =>
        left === right
          ? head.map((_, i) => i)
          : reversedRange({ head, left, right: right - 1 }),
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head,int left,int right){ListNode dummy=new ListNode(0,head),before=dummy;for(int i=0;i<left;i++)before=before.next;ListNode first=before.next;for(int i=0;i<right-left;i++){ListNode moved=first.next;first.next=moved.next;moved.next=before.next;before.next=moved;}return dummy.next;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int left,int right){ListNode dummy(0,head);auto before=&dummy;for(int i=0;i<left;i++)before=before->next;auto first=before->next;for(int i=0;i<right-left;i++){auto moved=first->next;first->next=moved->next;moved->next=before->next;before->next=moved;}return dummy.next;}};",
      "class Solution:\n    def solve(self, head, left, right):\n        dummy=ListNode(0,head)\n        before=dummy\n        for _ in range(left):\n            before=before.next\n        first=before.next\n        for _ in range(right-left):\n            moved=first.next\n            first.next=moved.next\n            moved.next=before.next\n            before.next=moved\n        return dummy.next\n",
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
      "LL17–19 author canonical candidates only; central materialization/reference execution pending",
    prepared: [],
    failures: [],
  };
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden])
      if (
        JSON.stringify(d.oracle(c.input)) !==
        JSON.stringify(d.independent(c.input))
      )
        report.failures.push(d.id + ": mismatch");
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
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
    "docs/release-evidence/content-LL-relink-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-LL-relink-template-sources.json",
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
if (process.argv[1]?.endsWith("linked-list-relink.mjs")) audit();
