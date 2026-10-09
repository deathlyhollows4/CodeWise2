// Preparation only: no wrappers, manifests, catalogue entries, or publication.
import { seeded } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const walk = (data, head) => {
  const path = [];
  while (head !== null) {
    if (path.includes(head)) throw Error("Acyclic preparation case required");
    path.push(head);
    head = data.next[head];
  }
  return path;
};
const intersection = ({ data }) => {
  const first = new Set(walk(data, data.heads[0]));
  return walk(data, data.heads[1]).find((id) => first.has(id)) ?? null;
};
const alignedIntersection = ({ data }) => {
  let a = data.heads[0],
    b = data.heads[1],
    left = walk(data, a).length,
    right = walk(data, b).length;
  while (left > right) {
    a = data.next[a];
    left--;
  }
  while (right > left) {
    b = data.next[b];
    right--;
  }
  while (a !== b) {
    a = a === null ? null : data.next[a];
    b = b === null ? null : data.next[b];
  }
  return a;
};
function intersections() {
  const r = seeded(0x1105);
  const cases = [];
  for (let t = 0; t < 720; t++) {
    const a = (r() >>> 8) % 12,
      b = (r() >>> 8) % 12,
      shared = t % 3 === 0 ? 0 : 1 + ((r() >>> 8) % 12),
      n = a + b + shared;
    const next = Array(n).fill(null),
      values = Array.from({ length: n }, () => ((r() >>> 12) % 7) - 3);
    const tail = shared ? a + b : null;
    for (let i = 0; i < a; i++) next[i] = i + 1 < a ? i + 1 : tail;
    for (let i = 0; i < b; i++) next[a + i] = i + 1 < b ? a + i + 1 : tail;
    for (let i = 0; i < shared - 1; i++) next[a + b + i] = a + b + i + 1;
    const heads = [a ? 0 : tail, b ? a : tail];
    const order = Array.from({ length: n }, (_, i) => i);
    for (let j = n - 1; j > 0; j--) {
      const k = (r() >>> 8) % (j + 1);
      [order[j], order[k]] = [order[k], order[j]];
    }
    const data = {
      values: Array(n),
      next: Array(n),
      heads: heads.map((x) => (x === null ? null : order[x])),
    };
    for (let i = 0; i < n; i++) {
      data.values[order[i]] = values[i];
      data.next[order[i]] = next[i] === null ? null : order[next[i]];
    }
    cases.push({
      input: { data },
      category: shared
        ? "shared-tail-permuted-identity"
        : "equal-values-with-disjoint-identity",
    });
  }
  cases.push({
    input: {
      data: {
        values: Array(2000).fill(7),
        next: Array.from({ length: 2000 }, (_, i) =>
          i === 1999 ? null : i + 1,
        ),
        heads: [0, 600],
      },
    },
    category: "long-identical-values-shared-suffix",
  });
  return cases;
}
const digitsBigInt = ({ left, right }) => {
  const number = (v) => BigInt([...v].reverse().join(""));
  return [...(number(left) + number(right)).toString()].reverse().map(Number);
};
const digitsCarry = ({ left, right }) => {
  const result = [];
  let carry = 0;
  for (let i = 0; i < Math.max(left.length, right.length) || carry; i++) {
    const sum = (left[i] ?? 0) + (right[i] ?? 0) + carry;
    result.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  while (result.length > 1 && result.at(-1) === 0) result.pop();
  return result.length ? result : [0];
};
function digitCases() {
  const r = seeded(0x1106);
  const cases = [];
  for (let t = 0; t < 720; t++) {
    const left = Array.from(
        { length: 1 + ((r() >>> 8) % 25) },
        () => (r() >>> 8) % 10,
      ),
      right = Array.from(
        { length: 1 + ((r() >>> 8) % 25) },
        () => (r() >>> 8) % 10,
      );
    cases.push({
      input: { left, right },
      category:
        t % 2
          ? "unequal-length-and-leading-zero-inputs"
          : "carry-and-signed-free-digits",
    });
  }
  cases.push(
    {
      input: { left: Array(2000).fill(9), right: [1] },
      category: "full-length-carry-cascade",
    },
    { input: { left: [0], right: [0] }, category: "canonical-zero-output" },
  );
  return cases;
}
function cloneBfs({ data }) {
  const ids = new Map(),
    queue = [];
  if (data.heads[0] !== null) {
    queue.push(data.heads[0]);
    ids.set(data.heads[0], 0);
  }
  for (let i = 0; i < queue.length; i++)
    for (const edge of ["next", "random"]) {
      const child = data[edge][queue[i]];
      if (child !== null && !ids.has(child)) {
        ids.set(child, queue.length);
        queue.push(child);
      }
    }
  return {
    values: queue.map((id) => data.values[id]),
    next: queue.map((id) =>
      data.next[id] === null ? null : ids.get(data.next[id]),
    ),
    random: queue.map((id) =>
      data.random[id] === null ? null : ids.get(data.random[id]),
    ),
    head: queue.length ? 0 : null,
    aliasesOriginal: false,
  };
}
function objectCloneOracle({ data }) {
  const originals = data.values.map((val) => ({
    val,
    next: null,
    random: null,
  }));
  originals.forEach((node, i) => {
    node.next = data.next[i] === null ? null : originals[data.next[i]];
    node.random = data.random[i] === null ? null : originals[data.random[i]];
  });
  const copies = new Map(
    originals.map((node) => [
      node,
      { val: node.val, next: null, random: null },
    ]),
  );
  for (const node of originals) {
    const copy = copies.get(node);
    copy.next = node.next === null ? null : copies.get(node.next);
    copy.random = node.random === null ? null : copies.get(node.random);
  }
  const root =
      data.heads[0] === null ? null : copies.get(originals[data.heads[0]]),
    levels = root ? [[root]] : [],
    seen = new Set(root ? [root] : []),
    ordered = [];
  for (let level = 0; level < levels.length; level++) {
    const children = [];
    for (const node of levels[level]) {
      ordered.push(node);
      for (const child of [node.next, node.random])
        if (child !== null && !seen.has(child)) {
          seen.add(child);
          children.push(child);
        }
    }
    if (children.length) levels.push(children);
  }
  const indexes = new Map(ordered.map((node, i) => [node, i]));
  return {
    values: ordered.map((n) => n.val),
    next: ordered.map((n) => (n.next === null ? null : indexes.get(n.next))),
    random: ordered.map((n) =>
      n.random === null ? null : indexes.get(n.random),
    ),
    head: root ? 0 : null,
    aliasesOriginal: ordered.some((n) => originals.includes(n)),
  };
}
function cloneCases() {
  const r = seeded(0x1107);
  const cases = [];
  for (let t = 0; t < 720; t++) {
    const n = 1 + ((r() >>> 8) % 25),
      values = Array.from({ length: n }, () => ((r() >>> 8) % 5) - 2),
      next = Array.from({ length: n }, (_, i) =>
        i + 1 < n ? i + 1 : t % 3 === 0 ? null : (r() >>> 8) % n,
      ),
      random = Array.from({ length: n }, () =>
        t % 7 === 0 ? null : (r() >>> 8) % (n + 1),
      );
    for (let i = 0; i < n; i++) if (random[i] === n) random[i] = null;
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = (r() >>> 8) % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const data = {
      values: Array(n),
      next: Array(n),
      random: Array(n),
      heads: [order[0]],
    };
    for (let i = 0; i < n; i++) {
      data.values[order[i]] = values[i];
      data.next[order[i]] = next[i] === null ? null : order[next[i]];
      data.random[order[i]] = random[i] === null ? null : order[random[i]];
    }
    cases.push({
      input: { data },
      category:
        t % 3 ? "next-cycle-random-aliases" : "finite-next-random-sharing",
    });
  }
  cases.push({
    input: { data: { values: [], next: [], random: [], heads: [null] } },
    category: "empty-root",
  });
  cases.push({
    input: {
      data: {
        values: Array(2000).fill(7),
        next: Array.from({ length: 2000 }, (_, i) => (i === 1999 ? 0 : i + 1)),
        random: Array.from({ length: 2000 }, (_, i) =>
          i % 2 === 0 ? 1999 : null,
        ),
        heads: [0],
      },
    },
    category: "large-cycle-and-shared-random-target",
  });
  return cases;
}
const reversedGroups = ({ head, k }) => {
  const out = [];
  for (let i = 0; i < head.length; i += k) {
    const group = head.slice(i, i + k);
    out.push(...(group.length === k ? group.reverse() : group));
  }
  return out;
};
const groupIndexOracle = ({ head, k }) =>
  head.map((_, i) => {
    const begin = i - (i % k);
    if (begin + k > head.length) return head[i];
    return head[begin + k - 1 - (i % k)];
  });
function groupCases() {
  const r = seeded(0x1108);
  const cases = [];
  for (let t = 0; t < 720; t++) {
    const head = Array.from(
        { length: (r() >>> 8) % 35 },
        () => ((r() >>> 8) % 17) - 8,
      ),
      k = 1 + ((r() >>> 8) % 12);
    cases.push({
      input: { head, k },
      category:
        head.length % k ? "incomplete-tail-preserved" : "all-complete-groups",
    });
  }
  cases.push(
    {
      input: { head: Array.from({ length: 2000 }, (_, i) => i), k: 37 },
      category: "large-incomplete-tail",
    },
    { input: { head: [1, 2, 3], k: 9 }, category: "no-complete-group" },
  );
  return cases;
}

export const preparations = [
  {
    id: "linked-list-05",
    step: 3,
    title: "Find the shared original node",
    objective:
      "Return the first shared original node of two acyclic chains, distinguishing equal values from shared pointer identity.",
    contract:
      "IdentityList data with exactly two heads, finite next links and every node reachable from at least one head; ListNodeIdentity output, no original-link mutation.",
    prerequisites: ["list.walk", "list.original-identity"],
    semanticNeeds: [
      "node-table requireReachable across both heads",
      "next links acyclic",
      "readOnlyNodes snapshot guard",
    ],
    futurePlanConflict:
      "old linked-list-13 intersection must receive a distinct replacement",
    visible: [
      {
        input: {
          data: { values: [7, 7, 7, 7], next: [2, 2, 3, null], heads: [0, 1] },
        },
        expected: 2,
        explanation:
          "The two prefixes meet at node2; equal values do not make node0 and node1 identical.",
      },
      {
        input: { data: { values: [5, 5], next: [null, null], heads: [0, 1] } },
        expected: null,
        explanation: "Equal-valued nodes belong to disjoint chains.",
      },
      {
        input: { data: { values: [9], next: [null], heads: [0, 0] } },
        expected: 0,
        explanation: "Both heads are already the same original node.",
      },
    ],
    generate: intersections,
    oracle: intersection,
    independent: alignedIntersection,
    mutations: {
      "equal-value-as-sharing": ({ data }) => {
        const values = new Set(
          walk(data, data.heads[0]).map((i) => data.values[i]),
        );
        return (
          walk(data, data.heads[1]).find((i) => values.has(data.values[i])) ??
          null
        );
      },
      "last-shared-node": ({ data }) => {
        const a = new Set(walk(data, data.heads[0]));
        return (
          walk(data, data.heads[1])
            .filter((i) => a.has(i))
            .at(-1) ?? null
        );
      },
    },
  },
  {
    id: "linked-list-06",
    step: 3,
    title: "Add two digit chains",
    objective:
      "Add nonnegative integers stored least-significant digit first in native linked lists, propagating carries across unequal chain lengths.",
    contract:
      "ListNode left and right each have 1..2,000 digits in0..9, least-significant first. Empty inputs are invalid. Most-significant zero input nodes are permitted and do not change numeric value. Output is a finite reversed-digit ListNode with no final most-significant zero unless the entire number is zero, represented by exactly one node0. Input identity reuse optional; input nodes must not be deleted.",
    prerequisites: ["list.walk", "list.link-splice"],
    semanticNeeds: [],
    futurePlanConflict:
      "old linked-list-15 digit-chain addition must receive a distinct replacement",
    visible: [
      {
        input: { left: [9, 9], right: [1] },
        expected: [0, 0, 1],
        explanation: "99+1=100; carry extends the result chain.",
      },
      {
        input: { left: [0, 0], right: [0] },
        expected: [0],
        explanation:
          "Leading zero input nodes are allowed; output zero is canonical.",
      },
      {
        input: { left: [2, 4, 3], right: [5, 6, 4] },
        expected: [7, 0, 8],
        explanation: "342+465=807 in least-significant-first order.",
      },
    ],
    generate: digitCases,
    oracle: digitsBigInt,
    independent: digitsCarry,
    mutations: {
      "omit-final-carry": (input) => {
        const result = digitsCarry(input);
        return result.length > Math.max(input.left.length, input.right.length)
          ? result.slice(0, -1)
          : result;
      },
      "ignore-carry-between-digits": ({ left, right }) =>
        Array.from(
          { length: Math.max(left.length, right.length) },
          (_, i) => ((left[i] ?? 0) + (right[i] ?? 0)) % 10,
        ),
    },
  },
  {
    id: "linked-list-07",
    step: 4,
    title: "Clone linked nodes with random links",
    objective:
      "Allocate an independent clone preserving next/random topology, cycles, duplicate values and sharing without any original-node alias.",
    contract:
      "IdentityList single root with next/random nullable indexes, every input node reachable by those links; CloneList rooted BFS(next before random) canonical output with aliasesOriginal:false, original links unchanged.",
    prerequisites: [
      "list.original-identity",
      "list.walk",
      "hashing.membership",
    ],
    semanticNeeds: [
      "node-table requireReachable over next/random",
      "readOnlyNodes snapshot guard",
    ],
    futurePlanConflict:
      "old linked-list-21 random clone must receive a distinct replacement",
    visible: [
      {
        input: {
          data: { values: [7, 7], next: [1, null], random: [1, 1], heads: [0] },
        },
        expected: {
          values: [7, 7],
          next: [1, null],
          random: [1, 1],
          head: 0,
          aliasesOriginal: false,
        },
        explanation:
          "Two equal-valued nodes remain distinct; both random links share the cloned second node.",
      },
      {
        input: { data: { values: [5], next: [0], random: [0], heads: [0] } },
        expected: {
          values: [5],
          next: [0],
          random: [0],
          head: 0,
          aliasesOriginal: false,
        },
        explanation:
          "A self-linked input needs one newly allocated self-linked clone.",
      },
      {
        input: { data: { values: [], next: [], random: [], heads: [null] } },
        expected: {
          values: [],
          next: [],
          random: [],
          head: null,
          aliasesOriginal: false,
        },
        explanation: "An empty root has an empty clone.",
      },
    ],
    generate: cloneCases,
    oracle: cloneBfs,
    independent: objectCloneOracle,
    mutations: {
      "return-original-as-clone": (input) => ({
        ...cloneBfs(input),
        aliasesOriginal: input.data.values.length > 0,
      }),
      "discard-random-links": (input) => {
        const result = cloneBfs(input);
        return { ...result, random: result.random.map(() => null) };
      },
    },
  },
  {
    id: "linked-list-08",
    step: 4,
    title: "Reverse complete groups and preserve the tail",
    objective:
      "Reverse each complete group of k native linked-list values while preserving an incomplete trailing group in its original order.",
    contract:
      "ListNode head is finite with 0..2,000 signed values in[-1,000,000,1,000,000];1≤k≤2,001. ListNode output is checked by value sequence, original-node reuse optional. Reverse only complete k-node groups. An incomplete tail, including the entire list when k exceeds its length, is not reversed. Empty head returns null; k=1 preserves values.",
    prerequisites: ["list.walk", "list.link-splice"],
    semanticNeeds: [],
    futurePlanConflict:
      "old linked-list-20 reverse groups must receive a distinct replacement",
    visible: [
      {
        input: { head: [1, 2, 3, 4, 5], k: 2 },
        expected: [2, 1, 4, 3, 5],
        explanation:
          "Two complete pairs reverse; the single-node tail stays unchanged.",
      },
      {
        input: { head: [1, 2, 3, 4, 5], k: 3 },
        expected: [3, 2, 1, 4, 5],
        explanation:
          "The two-node final group is incomplete and keeps its order.",
      },
      {
        input: { head: [7, 7], k: 1 },
        expected: [7, 7],
        explanation: "Groups of size1 leave the values unchanged.",
      },
    ],
    generate: groupCases,
    oracle: reversedGroups,
    independent: groupIndexOracle,
    mutations: {
      "reverse-incomplete-tail": ({ head, k }) => {
        const out = [];
        for (let i = 0; i < head.length; i += k)
          out.push(...head.slice(i, i + k).reverse());
        return out;
      },
      "reverse-whole-chain": ({ head }) => [...head].reverse(),
    },
  },
];

export function auditPreparations() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "LL05–08 preparation only; no wrappers/materialized packs or runtime references",
    published: 0,
    prepared: [],
    failures: [],
  };
  for (const p of preparations) {
    const visible = new Set(p.visible.map((c) => JSON.stringify(c.input))),
      unique = new Map();
    for (const c of p.generate()) {
      const key = JSON.stringify(c.input);
      if (!visible.has(key)) unique.set(key, c);
    }
    const hidden = [...unique.values()];
    for (const c of [...p.visible, ...hidden])
      if (
        JSON.stringify(p.oracle(c.input)) !==
        JSON.stringify(p.independent(c.input))
      )
        report.failures.push(p.id + ": oracle mismatch");
    if (hidden.length < 200)
      report.failures.push(p.id + ": hidden candidates below200");
    const mutations = Object.entries(p.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) =>
          JSON.stringify(fn(c.input)) !== JSON.stringify(p.oracle(c.input)),
      ),
    }));
    for (const m of mutations)
      if (!m.detected)
        report.failures.push(p.id + ": mutation not detected " + m.name);
    report.prepared.push({
      id: p.id,
      hiddenCandidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-next-preparation.json",
    JSON.stringify(report, null, 2),
  );
  console.log(report);
  if (report.failures.length) process.exitCode = 1;
}
if (process.argv[1]?.endsWith("linked-list-next-preparation.mjs"))
  auditPreparations();
