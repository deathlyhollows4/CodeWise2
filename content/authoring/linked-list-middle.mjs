import { seeded, logicalCases } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 },
  head = { kind: "array", maxLength: 2000, items: integer };
const index = { kind: "integer", minimum: 0, maximum: 1999 },
  nullableIndex = { kind: "nullable", value: index };
const indexes = { kind: "array", maxLength: 2000, items: index };
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-middle.mjs",
  step: 3,
};
const stablePartition = ({ head, pivot }) =>
  head
    .map((_, i) => i)
    .filter((i) => head[i] < pivot)
    .concat(head.map((_, i) => i).filter((i) => head[i] >= pivot));
const partitionIndependent = ({ head, pivot }) =>
  head
    .map((value, index) => ({ value, index }))
    .sort(
      (a, b) =>
        Number(a.value >= pivot) - Number(b.value >= pivot) ||
        a.index - b.index,
    )
    .map((x) => x.index);
function partitionCases() {
  const r = seeded(0x1113),
    out = [];
  for (let t = 0; t < 720; t++) {
    const values = Array.from(
        { length: (r() >>> 8) % 32 },
        () => ((r() >>> 8) % 17) - 8,
      ),
      pivot =
        t % 3 === 0 && values.length
          ? values[(r() >>> 8) % values.length]
          : ((r() >>> 8) % 21) - 10;
    out.push({
      input: { head: values, pivot },
      category: t % 3 ? "stable-two-buckets" : "equal-pivot-multiplicity",
    });
  }
  out.push({
    input: {
      head: Array.from({ length: 2000 }, (_, i) => (i % 7) - 3),
      pivot: 0,
    },
    category: "large-stable-buckets",
  });
  return out;
}
function historyArray({ homepage, commands, pages, steps }, discard = true) {
  const history = [homepage],
    out = [];
  let at = 0;
  for (let i = 0; i < commands.length; i++) {
    if (commands[i] === "visit") {
      if (discard) history.splice(at + 1);
      history.splice(at + 1, 0, pages[i]);
      at++;
    } else if (commands[i] === "back") at = Math.max(0, at - steps[i]);
    else at = Math.min(history.length - 1, at + steps[i]);
    out.push(history[at]);
  }
  return out;
}
function historyLinks({ homepage, commands, pages, steps }) {
  let current = { page: homepage, prev: null, next: null };
  const out = [];
  for (let i = 0; i < commands.length; i++) {
    if (commands[i] === "visit") {
      const node = { page: pages[i], prev: current, next: null };
      current.next = node;
      current = node;
    } else {
      const side = commands[i] === "back" ? "prev" : "next";
      let remaining = steps[i];
      while (remaining && current[side]) {
        current = current[side];
        remaining--;
      }
    }
    out.push(current.page);
  }
  return out;
}
function histories() {
  const r = seeded(0x1114),
    labels = ["alpha", "beta", "gamma", "delta", "epsilon"],
    out = [];
  for (let t = 0; t < 720; t++) {
    const n = (r() >>> 8) % 100,
      commands = [],
      pages = [],
      steps = [];
    for (let i = 0; i < n; i++) {
      commands.push(["visit", "back", "forward"][(r() >>> 8) % 3]);
      pages.push(labels[(r() >>> 8) % labels.length]);
      steps.push(i % 11 === 0 ? 1000000000 : (r() >>> 8) % 12);
    }
    out.push({
      input: { homepage: "home", commands, pages, steps },
      category:
        t % 2
          ? "branch-invalidation-and-clamped-navigation"
          : "duplicate-page-labels-and-zero-steps",
    });
  }
  out.push({
    input: {
      homepage: "home",
      commands: Array.from(
        { length: 2000 },
        (_, i) => ["visit", "back", "forward"][i % 3],
      ),
      pages: Array(2000).fill("alpha"),
      steps: Array(2000).fill(1000000000),
    },
    category: "large-history-clamps",
  });
  return out;
}
const path = (data, start) => {
  const result = [];
  while (start !== null) {
    if (result.includes(start)) throw Error("Acyclic chains required");
    result.push(start);
    start = data.next[start];
  }
  return result;
};
function sharedMerge({ data }) {
  const a = path(data, data.heads[0]),
    b = path(data, data.heads[1]),
    shared = b.find((id) => a.includes(id)) ?? null,
    left = shared === null ? a : a.slice(0, a.indexOf(shared)),
    right = shared === null ? b : b.slice(0, b.indexOf(shared)),
    out = [];
  let i = 0,
    j = 0;
  while (i < left.length || j < right.length) {
    if (
      j === right.length ||
      (i < left.length && data.values[left[i]] <= data.values[right[j]])
    )
      out.push(left[i++]);
    else out.push(right[j++]);
  }
  return out.concat(shared === null ? [] : a.slice(a.indexOf(shared)));
}
function unionSorted({ data }) {
  const a = path(data, data.heads[0]),
    b = path(data, data.heads[1]),
    inA = new Set(a),
    inB = new Set(b),
    all = [...new Set([...a, ...b])];
  const priority = (id) =>
      inA.has(id) && inB.has(id) ? 2 : inA.has(id) ? 0 : 1,
    ordinal = (id) => (inA.has(id) ? a.indexOf(id) : b.indexOf(id));
  return all.sort(
    (x, y) =>
      data.values[x] - data.values[y] ||
      priority(x) - priority(y) ||
      ordinal(x) - ordinal(y),
  );
}
function mergeCases() {
  const r = seeded(0x1115),
    out = [];
  for (let t = 0; t < 720; t++) {
    const a = (r() >>> 8) % 10,
      b = (r() >>> 8) % 10,
      c = t % 3 === 0 ? 0 : 1 + ((r() >>> 8) % 10),
      left = Array.from({ length: a }, () => ((r() >>> 8) % 11) - 5).sort(
        (x, y) => x - y,
      ),
      right = Array.from({ length: b }, () => ((r() >>> 8) % 11) - 5).sort(
        (x, y) => x - y,
      ),
      shared = [];
    let value = Math.max(left.at(-1) ?? -5, right.at(-1) ?? -5);
    for (let i = 0; i < c; i++) {
      value += (r() >>> 8) % 3;
      shared.push(value);
    }
    if (t % 7 === 0) {
      left.fill(7);
      right.fill(7);
      shared.fill(7);
    }
    const values = [...left, ...right, ...shared],
      n = values.length,
      next = Array(n).fill(null),
      common = c ? a + b : null;
    for (let i = 0; i < a; i++) next[i] = i + 1 < a ? i + 1 : common;
    for (let i = 0; i < b; i++) next[a + i] = i + 1 < b ? a + i + 1 : common;
    for (let i = 0; i < c - 1; i++) next[a + b + i] = a + b + i + 1;
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = (r() >>> 8) % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const data = {
      values: Array(n),
      next: Array(n),
      heads: [a ? 0 : common, b ? a : common].map((id) =>
        id === null ? null : order[id],
      ),
    };
    for (let i = 0; i < n; i++) {
      data.values[order[i]] = values[i];
      data.next[order[i]] = next[i] === null ? null : order[next[i]];
    }
    out.push({
      input: { data },
      category: c
        ? "shared-suffix-with-stable-prefixes"
        : "disjoint-sorted-chains",
    });
  }
  out.push({
    input: {
      data: {
        values: Array(2000).fill(7),
        next: Array.from({ length: 2000 }, (_, i) =>
          i === 1999 ? null : i + 1,
        ),
        heads: [0, 600],
      },
    },
    category: "long-shared-equal-valued-suffix",
  });
  return out;
}
const uniqueRuns = ({ head }) =>
  head
    .map((_, i) => i)
    .filter(
      (i) =>
        (i === 0 || head[i - 1] !== head[i]) &&
        (i === head.length - 1 || head[i + 1] !== head[i]),
    );
const uniqueCounts = ({ head }) => {
  const counts = new Map();
  for (const value of head) counts.set(value, (counts.get(value) ?? 0) + 1);
  return head.map((_, i) => i).filter((i) => counts.get(head[i]) === 1);
};
function repeatedCases() {
  const r = seeded(0x1116),
    out = [];
  for (let t = 0; t < 720; t++) {
    const values = Array.from(
      { length: (r() >>> 8) % 35 },
      () => ((r() >>> 8) % 17) - 8,
    ).sort((a, b) => a - b);
    out.push({
      input: { head: values },
      category:
        t % 2
          ? "repeated-runs-and-signed-labels"
          : "all-unique-or-all-repeated-edges",
    });
  }
  out.push(
    {
      input: { head: Array(2000).fill(7) },
      category: "entire-large-run-removed",
    },
    {
      input: { head: Array.from({ length: 2000 }, (_, i) => i - 1000) },
      category: "large-all-unique-chain",
    },
  );
  return out;
}
export const definitions = [
  {
    ...common,
    id: "linked-list-13",
    slug: "stable-original-node-partition",
    title: "Make two stable buckets of original nodes",
    skillIds: ["list.stable-bucket-relink", "list.two-output-tails"],
    prerequisites: ["list.walk", "list.link-splice"],
    checkpointIds: ["linked-list-14", "linked-list-16", "linked-list-06"],
    remedialIds: ["linked-list-01", "linked-list-02"],
    nextIds: ["linked-list-15"],
    objective:
      "Relink original nodes into less-than-pivot and at-least-pivot buckets while preserving order inside each bucket.",
    rationale:
      "The tails of two temporary chains let each original node keep its place within its bucket.",
    statement:
      "## Partition without exchanging identities\n\nPlace every original node whose value is less than pivot before every node whose value is at least pivot. Preserve the original order inside each of these two buckets. A value equal to the pivot belongs in the second bucket.\n\n## Native function\n\n`solve(head,pivot)` receives a finite native ListNode head and an integer. A node exposes val and next. Return the relinked native head, or null for empty input. Keep every original node once and preserve its value. Do not substitute new equal-valued nodes, delete input nodes, or redeclare the supplied class.\n\n### Representation note\n\nExpected results are original node indexes. The wrapper checks actual node identity, unchanged values, and a finite result chain; your function returns a native head rather than an index array.",
    constraints: [
      "0 ≤ node count ≤ 2,000.",
      "Node values and pivot lie in [-1,000,000,1,000,000].",
      "Every original node appears once, and values remain unchanged.",
      "Relative order inside each bucket is stable; the result must be finite.",
    ],
    interface:
      "Solution.solve(head,pivot) returns ListNode; the wrapper reports ListNodeIdentitySequence.",
    inputSchema: { kind: "object", properties: { head, pivot: integer } },
    outputSchema: indexes,
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "pivot", type: "int" },
      ],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [3, 1, 3, 2], pivot: 3 },
        expected: [1, 3, 0, 2],
        explanation:
          "The less-than bucket keeps nodes 1 and 3; the other bucket keeps nodes 0 and 2.",
      },
      {
        input: { head: [7, 7, 7], pivot: 7 },
        expected: [0, 1, 2],
        explanation:
          "Equal values all stay in the second bucket without changing identity order.",
      },
      {
        input: { head: [], pivot: 0 },
        expected: [],
        explanation: "A null head produces an empty original-node sequence.",
      },
    ],
    generate: partitionCases,
    oracle: stablePartition,
    independent: partitionIndependent,
    mutations: {
      "equal-pivot-in-first-bucket": ({ head, pivot }) =>
        head
          .map((_, i) => i)
          .filter((i) => head[i] <= pivot)
          .concat(head.map((_, i) => i).filter((i) => head[i] > pivot)),
      "reverse-first-bucket": ({ head, pivot }) =>
        head
          .map((_, i) => i)
          .filter((i) => head[i] < pivot)
          .reverse()
          .concat(head.map((_, i) => i).filter((i) => head[i] >= pivot)),
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head,int pivot){ListNode low=new ListNode(0),high=new ListNode(0),a=low,b=high;while(head!=null){ListNode next=head.next;head.next=null;if(head.val<pivot){a.next=head;a=head;}else{b.next=head;b=head;}head=next;}a.next=high.next;return low.next;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int pivot){ListNode low(0),high(0);auto a=&low;auto b=&high;while(head){auto next=head->next;head->next=nullptr;if(head->val<pivot){a->next=head;a=head;}else{b->next=head;b=head;}head=next;}a->next=high.next;return low.next;}};",
      "class Solution:\n    def solve(self, head, pivot):\n        low,high=ListNode(0),ListNode(0)\n        a,b=low,high\n        while head is not None:\n            following=head.next\n            head.next=None\n            if head.val<pivot:\n                a.next=head\n                a=head\n            else:\n                b.next=head\n                b=head\n            head=following\n        a.next=high.next\n        return low.next\n",
    ),
  },
  {
    ...common,
    id: "linked-list-14",
    slug: "browser-history-forward-branch-invalidation",
    title: "Keep a browser history after changing direction",
    skillIds: ["list.cursor-navigation", "list.forward-branch-invalidation"],
    prerequisites: ["list.link-splice"],
    checkpointIds: ["linked-list-13", "linked-list-16"],
    remedialIds: ["linked-list-01"],
    nextIds: ["linked-list-17"],
    objective:
      "Maintain a current history position, clamp back/forward navigation, and discard the forward branch after a new visit.",
    rationale:
      "History navigation preserves previous visits, while a visit after going back deliberately invalidates only the forward branch.",
    statement:
      "## Replay the visits\n\nStart at homepage with no other history. A visit moves to the supplied page and discards every page forward of the old current position. Back and forward move by at most the supplied number of steps, stopping at the available boundary. Return the current page after each command. Repeated page names still represent separate visits.\n\n## Typed function\n\n`solve(homepage,commands,pages,steps)` receives ordinary typed arrays of equal length. A visit uses pages[i] and ignores steps[i]. Back/forward use steps[i] and ignore pages[i]. Commands are exactly visit, back, and forward. Page names are opaque lowercase labels, not network destinations; no browsing or parsing is needed. Each call starts with fresh history.\n\n## Edge cases\n\nZero steps leave the current page unchanged. A large step count stops at the oldest/latest available page. Visiting after back must not retain a discarded forward branch. An empty command history returns an empty array. Aim for constant-time linking on visit and work proportional to the links actually traversed on navigation.",
    constraints: [
      "1 ≤ homepage.length and every page-label length ≤ 40; labels contain lowercase letters.",
      "0 ≤ command count ≤ 2,000; parallel arrays have equal lengths.",
      "0 ≤ steps[i] ≤ 1,000,000,000.",
      "Commands are exactly visit, back, or forward; unused page/step slots are ignored.",
    ],
    interface:
      "Solution.solve(homepage,commands,pages,steps) receives string,string[],string[],int[] and returns string[].",
    inputSchema: {
      kind: "object",
      properties: {
        homepage: { kind: "string", ascii: true, minLength: 1, maxLength: 40 },
        commands: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "enum", values: ["visit", "back", "forward"] },
        },
        pages: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "string", ascii: true, minLength: 1, maxLength: 40 },
        },
        steps: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "integer", minimum: 0, maximum: 1000000000 },
        },
      },
    },
    outputSchema: {
      kind: "array",
      maxLength: 2000,
      items: { kind: "string", ascii: true, minLength: 1, maxLength: 40 },
    },
    semanticConstraints: [
      { kind: "lengths-equal", left: "commands", right: "pages" },
      { kind: "lengths-equal", left: "commands", right: "steps" },
      { kind: "alphabet", field: "homepage", alphabet: "lowercase" },
      { kind: "alphabet", field: "pages", alphabet: "lowercase", each: true },
    ],
    function: {
      arguments: [
        { name: "homepage", type: "string" },
        { name: "commands", type: "string[]" },
        { name: "pages", type: "string[]" },
        { name: "steps", type: "int[]" },
      ],
      returnType: "string[]",
    },
    visible: [
      {
        input: {
          homepage: "home",
          commands: ["visit", "visit", "back", "visit", "forward", "back"],
          pages: ["alpha", "beta", "unused", "gamma", "unused", "unused"],
          steps: [0, 0, 1, 0, 10, 1],
        },
        expected: ["alpha", "beta", "alpha", "gamma", "gamma", "alpha"],
        explanation:
          "Visiting gamma from alpha discards beta, so forward cannot recover beta.",
      },
      {
        input: {
          homepage: "home",
          commands: ["back", "visit", "back", "forward"],
          pages: ["unused", "alpha", "unused", "unused"],
          steps: [1000000000, 0, 1000000000, 1000000000],
        },
        expected: ["home", "alpha", "home", "alpha"],
        explanation:
          "Navigation clamps to the available ends instead of walking beyond history.",
      },
      {
        input: { homepage: "home", commands: [], pages: [], steps: [] },
        expected: [],
        explanation: "No command means no reported current-page result.",
      },
    ],
    generate: histories,
    oracle: historyArray,
    independent: historyLinks,
    mutations: {
      "keep-invalidated-forward-branch": (input) => historyArray(input, false),
      "back-always-one-step": (input) =>
        historyArray({
          ...input,
          steps: input.steps.map((n, i) =>
            input.commands[i] === "back" ? Math.min(n, 1) : n,
          ),
        }),
    },
    languages: refs(
      'class Solution {static class Entry{String page;Entry prev,next;Entry(String p){page=p;}}public String[] solve(String homepage,String[] commands,String[] pages,int[] steps){Entry current=new Entry(homepage);String[] out=new String[commands.length];for(int i=0;i<commands.length;i++){if(commands[i].equals("visit")){Entry node=new Entry(pages[i]);node.prev=current;current.next=node;current=node;}else{int left=steps[i];if(commands[i].equals("back")){while(left>0&&current.prev!=null){current=current.prev;left--;}}else{while(left>0&&current.next!=null){current=current.next;left--;}}}out[i]=current.page;}return out;}}',
      'class Solution {struct Entry{string page;Entry* prev=nullptr;Entry* next=nullptr;explicit Entry(string p):page(std::move(p)){}};public:vector<string> solve(string homepage,vector<string> commands,vector<string> pages,vector<int> steps){vector<unique_ptr<Entry>> owned;owned.push_back(make_unique<Entry>(homepage));auto current=owned.back().get();vector<string> out;for(size_t i=0;i<commands.size();i++){if(commands[i]=="visit"){owned.push_back(make_unique<Entry>(pages[i]));auto node=owned.back().get();node->prev=current;current->next=node;current=node;}else{int left=steps[i];if(commands[i]=="back"){while(left>0&&current->prev){current=current->prev;left--;}}else{while(left>0&&current->next){current=current->next;left--;}}}out.push_back(current->page);}return out;}};',
      'class Solution:\n    def solve(self, homepage, commands, pages, steps):\n        class Entry:\n            def __init__(self,page):\n                self.page=page\n                self.prev=self.next=None\n        current=Entry(homepage)\n        out=[]\n        for command,page,count in zip(commands,pages,steps):\n            if command=="visit":\n                node=Entry(page)\n                node.prev=current\n                current.next=node\n                current=node\n            else:\n                side="prev" if command=="back" else "next"\n                while count>0 and getattr(current,side) is not None:\n                    current=getattr(current,side)\n                    count-=1\n            out.append(current.page)\n        return out\n',
    ),
  },
  {
    ...common,
    id: "linked-list-15",
    step: 4,
    slug: "merge-sorted-chains-with-shared-suffix",
    title: "Merge sorted chains without duplicating their shared tail",
    skillIds: ["list.alias-aware-stable-merge", "list.shared-suffix-once"],
    prerequisites: [
      "list.shared-tail-identity",
      "list.link-splice",
      "sorted.order",
    ],
    checkpointIds: ["linked-list-07", "linked-list-08"],
    remedialIds: ["linked-list-05", "linked-list-01", "two-pointers-04"],
    nextIds: ["linked-list-11"],
    objective:
      "Merge the disjoint prefixes of sorted native chains stably, then append their shared suffix exactly once.",
    rationale:
      "A shared suffix is one physical chain, not two copies of equal values. Equal-valued prefixes must be finished before attaching that suffix.",
    statement:
      "## Merge two sorted native chains\n\nTwo nondecreasing chains may share the same physical suffix. Merge their disjoint prefixes in sorted order, choosing the first chain before the second when prefix values tie. Then append the shared suffix once. If no suffix is shared, merge both whole chains. Every original node in the union must appear once, with its value unchanged.\n\n## Native function\n\n`solve(data)` receives IdentityList with native heads in heads[0] and heads[1]. A ListNode exposes val and next. Both chains are finite and sorted; either head may be null. Return the native merged head. You may change next links, but do not substitute copied nodes, change values, or delete input nodes.\n\n## Aliasing edge cases\n\nIdentical heads already describe one chain. A chain can start inside the other chain. Equal values in a disjoint prefix are not shared nodes, and the shared suffix must follow both disjoint prefixes even when their values tie. An ordinary value-only merge can create a cycle by consuming a shared node twice.\n\n### Representation note\n\nExamples use one table of original nodes and two head indexes. Storage order may differ from traversal order. The result is displayed as original node indexes checked from the returned native chain.",
    constraints: [
      "0 ≤ original node count ≤ 2,000; values lie in [-1,000,000,1,000,000].",
      "Both next chains are acyclic and nondecreasing; every node is reachable from at least one head.",
      "The input may have a shared suffix; equal-valued distinct nodes remain distinct.",
      "Output contains the original union once, preserves values, and is finite.",
    ],
    interface:
      "Solution.solve(data) receives IdentityList and returns ListNodeIdentitySequence.",
    inputSchema: {
      kind: "object",
      properties: {
        data: {
          kind: "object",
          properties: {
            values: head,
            next: { kind: "array", maxLength: 2000, items: nullableIndex },
            heads: {
              kind: "array",
              minLength: 2,
              maxLength: 2,
              items: nullableIndex,
            },
          },
        },
      },
    },
    outputSchema: indexes,
    semanticConstraints: [
      {
        kind: "node-table",
        field: "data",
        links: ["next"],
        heads: "heads",
        requireReachable: true,
        acyclicLinks: ["next"],
        sortedLinks: ["next"],
      },
    ],
    valid: ({ data }) =>
      data.next.every(
        (next, i) => next === null || data.values[i] <= data.values[next],
      ),
    function: {
      arguments: [{ name: "data", type: "IdentityList" }],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: {
          data: { values: [7, 7, 7, 8], next: [2, 2, 3, null], heads: [0, 1] },
        },
        expected: [0, 1, 2, 3],
        explanation:
          "Both equal-valued prefixes precede the shared nodes 2 and 3; that suffix appears once.",
      },
      {
        input: {
          data: {
            values: [1, 3, 2, 4],
            next: [1, null, 3, null],
            heads: [0, 2],
          },
        },
        expected: [0, 2, 1, 3],
        explanation: "Disjoint sorted chains merge in ordinary sorted order.",
      },
      {
        input: { data: { values: [], next: [], heads: [null, null] } },
        expected: [],
        explanation: "Two null heads yield a null merged head.",
      },
    ],
    generate: mergeCases,
    oracle: sharedMerge,
    independent: unionSorted,
    mutations: {
      "duplicate-shared-suffix": ({ data }) => {
        const a = path(data, data.heads[0]),
          b = path(data, data.heads[1]);
        return [...a, ...b].sort((x, y) => data.values[x] - data.values[y]);
      },
      "right-prefix-before-left-ties": ({ data }) => {
        const a = path(data, data.heads[0]),
          b = path(data, data.heads[1]),
          aa = new Set(a),
          bb = new Set(b),
          priority = (id) =>
            aa.has(id) && bb.has(id) ? 2 : bb.has(id) ? 0 : 1;
        return [...new Set([...a, ...b])].sort(
          (x, y) =>
            data.values[x] - data.values[y] || priority(x) - priority(y),
        );
      },
    },
    languages: refs(
      "class Solution {public ListNode solve(IdentityList data){ListNode left=data.heads[0],right=data.heads[1],a=left,b=right;int x=0,y=0;for(ListNode p=a;p!=null;p=p.next)x++;for(ListNode p=b;p!=null;p=p.next)y++;while(x>y){a=a.next;x--;}while(y>x){b=b.next;y--;}while(a!=b){a=a.next;b=b.next;}ListNode common=a,dummy=new ListNode(0),tail=dummy;while(left!=common||right!=common){if(right==common||left!=common&&left.val<=right.val){ListNode next=left.next;tail.next=left;tail=left;left=next;}else{ListNode next=right.next;tail.next=right;tail=right;right=next;}}tail.next=common;return dummy.next;}}",
      "class Solution {public:ListNode* solve(IdentityList data){auto left=data.heads[0];auto right=data.heads[1];auto a=left;auto b=right;int x=0,y=0;for(auto p=a;p;p=p->next)x++;for(auto p=b;p;p=p->next)y++;while(x>y){a=a->next;x--;}while(y>x){b=b->next;y--;}while(a!=b){a=a->next;b=b->next;}auto common=a;ListNode dummy(0);auto tail=&dummy;while(left!=common||right!=common){if(right==common||(left!=common&&left->val<=right->val)){auto next=left->next;tail->next=left;tail=left;left=next;}else{auto next=right->next;tail->next=right;tail=right;right=next;}}tail->next=common;return dummy.next;}};",
      "class Solution:\n    def solve(self, data):\n        left,right=data.heads\n        a,b=left,right\n        x=y=0\n        p=a\n        while p is not None:\n            x+=1\n            p=p.next\n        p=b\n        while p is not None:\n            y+=1\n            p=p.next\n        while x>y:\n            a=a.next\n            x-=1\n        while y>x:\n            b=b.next\n            y-=1\n        while a is not b:\n            a,b=a.next,b.next\n        common=a\n        dummy=ListNode(0)\n        tail=dummy\n        while left is not common or right is not common:\n            if right is common or left is not common and left.val<=right.val:\n                following=left.next\n                tail.next=left\n                tail=left\n                left=following\n            else:\n                following=right.next\n                tail.next=right\n                tail=right\n                right=following\n        tail.next=common\n        return dummy.next\n",
    ),
  },
  {
    ...common,
    id: "linked-list-16",
    slug: "discard-every-repeated-sorted-label",
    title: "Keep only labels that occur once",
    skillIds: ["list.whole-run-deletion", "list.retained-tail-linking"],
    prerequisites: ["list.walk", "list.link-splice", "sorted.order"],
    checkpointIds: ["linked-list-13", "linked-list-14"],
    remedialIds: ["linked-list-01", "two-pointers-04"],
    nextIds: ["linked-list-15"],
    objective:
      "Remove an entire repeated-value run rather than keeping one representative, preserving the identities of uniquely occurring nodes.",
    rationale:
      "The retained tail must reconnect past every node of a repeated run, including a repeated run at the head or end.",
    statement:
      "## Delete whole repeated runs\n\nThe native input list is nondecreasing. Keep a node only when its value occurs exactly once in the entire list. If a value is repeated, remove every node in that run; do not keep one representative. Preserve the order, identity, and values of the retained nodes.\n\n## Native function\n\n`solve(head)` receives ListNode or null and returns the retained native head or null. Nodes expose val and next. You may relink next pointers. Do not create replacement answer nodes, change values, delete runner-owned input nodes, or redeclare the supplied class.\n\n## Edge cases\n\nThe result is null when every value repeats. Unique nodes before, between, and after repeated runs remain. A singleton is kept.\n\n### Representation note\n\nThe result is displayed as original node indexes, verified from the returned objects. This is different from ordinary deduplication, which keeps one node from every run.",
    constraints: [
      "0 ≤ node count ≤ 2,000; values lie in [-1,000,000,1,000,000].",
      "The finite input is nondecreasing.",
      "Retain exactly the nodes whose values occur once, with original values/identities unchanged.",
    ],
    interface:
      "Solution.solve(head) returns a native ListNode; ListNodeIdentitySequence checks surviving original nodes.",
    inputSchema: { kind: "object", properties: { head } },
    outputSchema: indexes,
    semanticConstraints: [{ kind: "sorted", field: "head" }],
    valid: ({ head }) => head.every((v, i) => i === 0 || head[i - 1] <= v),
    function: {
      arguments: [{ name: "head", type: "ListNode" }],
      returnType: "ListNodeIdentitySequence",
    },
    visible: [
      {
        input: { head: [1, 1, 2, 3, 3, 4] },
        expected: [2, 5],
        explanation:
          "Both nodes containing 1 and both nodes containing 3 are discarded; original nodes 2 and 5 remain.",
      },
      {
        input: { head: [7, 7, 7] },
        expected: [],
        explanation: "A wholly repeated list has no retained node.",
      },
      {
        input: { head: [-2, 0, 4] },
        expected: [0, 1, 2],
        explanation:
          "Every value occurs once, so all original nodes are retained.",
      },
    ],
    generate: repeatedCases,
    oracle: uniqueRuns,
    independent: uniqueCounts,
    mutations: {
      "keep-one-per-run": ({ head }) =>
        head.map((_, i) => i).filter((i) => i === 0 || head[i - 1] !== head[i]),
      "discard-only-later-duplicates": ({ head }) =>
        head
          .map((_, i) => i)
          .filter((i) => i === head.length - 1 || head[i] !== head[i + 1]),
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head){ListNode dummy=new ListNode(0),tail=dummy;while(head!=null){ListNode last=head;while(last.next!=null&&last.next.val==head.val)last=last.next;ListNode after=last.next;if(last==head){tail.next=head;tail=head;}head=after;}tail.next=null;return dummy.next;}}",
      "class Solution {public:ListNode* solve(ListNode* head){ListNode dummy(0);auto tail=&dummy;while(head){auto last=head;while(last->next&&last->next->val==head->val)last=last->next;auto after=last->next;if(last==head){tail->next=head;tail=head;}head=after;}tail->next=nullptr;return dummy.next;}};",
      "class Solution:\n    def solve(self, head):\n        dummy=ListNode(0)\n        tail=dummy\n        while head is not None:\n            last=head\n            while last.next is not None and last.next.val==head.val:\n                last=last.next\n            after=last.next\n            if last is head:\n                tail.next=head\n                tail=head\n            head=after\n        tail.next=None\n        return dummy.next\n",
    ),
  },
];
for (const definition of definitions) {
  const starters = buildFunctionStarters(definition.function);
  for (const language of ["java", "cpp", "python"])
    definition.languages[language].starter = starters[language];
}
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "LL13–16 author modules only; central materialization pending reviewed sorted-links guard",
    referenceRuntime: "not-run",
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
      hiddenCandidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-middle-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-LL-middle-template-sources.json",
    JSON.stringify(definitions.map(definition => ({
      id: definition.id,
      languages: definition.languages,
      wrappers: buildFunctionHarness(definition.function),
    }))),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("linked-list-middle.mjs")) audit();
