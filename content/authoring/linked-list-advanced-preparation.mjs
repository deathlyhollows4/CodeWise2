// Trusted oracle/case preparation. No wrappers or manifest publication here.
import { seeded } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const ringOrder = ({ data }) => {
  const result = [];
  let node = data.heads[0];
  while (node !== null && !result.includes(node)) {
    result.push(node);
    node = data.next[node];
  }
  if (result.length && node !== data.heads[0])
    throw Error("Single ring required");
  return result;
};
const survivor = (input) => {
  const order = ringOrder(input);
  if (!order.length) return null;
  let rank = 0;
  for (let size = 2; size <= order.length; size++)
    rank = (rank + input.k) % size;
  return order[rank];
};
const removedSurvivor = (input) => {
  const order = ringOrder(input);
  let cursor = 0;
  while (order.length > 1) {
    cursor = (cursor + input.k - 1) % order.length;
    order.splice(cursor, 1);
  }
  return order[0] ?? null;
};
function rings() {
  const r = seeded(0x1109),
    cases = [];
  for (let t = 0; t < 730; t++) {
    const n = (r() >>> 8) % 30,
      order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = (r() >>> 8) % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const next = Array(n);
    for (let i = 0; i < n; i++) next[order[i]] = order[(i + 1) % n];
    cases.push({
      input: {
        data: {
          values: Array.from({ length: n }, () => ((r() >>> 8) % 7) - 3),
          next,
          heads: [n ? order[0] : null],
        },
        k: t % 7 === 0 ? 1000000000 : 1 + ((r() >>> 8) % 50),
      },
      category:
        t % 7 === 0
          ? "large-step-modulo-ring"
          : "permuted-storage-duplicate-values",
    });
  }
  cases.push({
    input: {
      data: {
        values: Array(2000).fill(7),
        next: Array.from({ length: 2000 }, (_, i) => (i + 1) % 2000),
        heads: [1357],
      },
      k: 1000000000,
    },
    category: "large-ring-equal-values-and-offset-head",
  });
  return cases;
}
const alternate = ({ head }) => {
  const out = [];
  let a = 0,
    b = head.length - 1;
  while (a <= b) {
    out.push(a++);
    if (a <= b) out.push(b--);
  }
  return out;
};
const alternateQueue = ({ head }) => {
  const remaining = head.map((_, i) => i),
    out = [];
  while (remaining.length) {
    out.push(remaining.shift());
    if (remaining.length) out.push(remaining.pop());
  }
  return out;
};
function lists(seed) {
  const r = seeded(seed),
    out = [];
  for (let t = 0; t < 730; t++)
    out.push({
      input: {
        head: Array.from(
          { length: (r() >>> 8) % 30 },
          () => ((r() >>> 8) % 11) - 5,
        ),
      },
      category:
        t % 2
          ? "duplicate-key-identities"
          : "signed-value-and-length-boundaries",
    });
  out.push(
    {
      input: { head: Array.from({ length: 2000 }, (_, i) => (i % 5) - 2) },
      category: "large-duplicate-key-chain",
    },
    {
      input: { head: Array(2000).fill(7) },
      category: "large-all-equal-identities",
    },
  );
  return out;
}
const stableIndices = ({ head }) =>
  head
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .map((x) => x.index);
function stableMerge({ head }) {
  function sort(indexes) {
    if (indexes.length < 2) return indexes;
    const mid = Math.floor(indexes.length / 2),
      left = sort(indexes.slice(0, mid)),
      right = sort(indexes.slice(mid)),
      out = [];
    let a = 0,
      b = 0;
    while (a < left.length || b < right.length) {
      if (
        b === right.length ||
        (a < left.length && head[left[a]] <= head[right[b]])
      )
        out.push(left[a++]);
      else out.push(right[b++]);
    }
    return out;
  }
  return sort(head.map((_, i) => i));
}
function lruMap(
  { capacity, commands, keys, values },
  refreshGet = true,
  badUpdate = false,
) {
  const cache = new Map(),
    out = [];
  for (let i = 0; i < commands.length; i++) {
    const key = keys[i];
    if (commands[i] === "get") {
      if (!cache.has(key)) out.push(-1);
      else {
        const value = cache.get(key);
        if (refreshGet) {
          cache.delete(key);
          cache.set(key, value);
        }
        out.push(value);
      }
    } else {
      out.push(0);
      if (capacity === 0) continue;
      if (badUpdate && cache.has(key) && cache.size === capacity)
        cache.delete(cache.keys().next().value);
      cache.delete(key);
      cache.set(key, values[i]);
      if (cache.size > capacity) cache.delete(cache.keys().next().value);
    }
  }
  return out;
}
function lruArray({ capacity, commands, keys, values }) {
  const recency = [],
    stored = {},
    out = [];
  for (let i = 0; i < commands.length; i++) {
    const key = keys[i],
      position = recency.indexOf(key);
    if (commands[i] === "get") {
      if (position < 0) {
        out.push(-1);
        continue;
      }
      out.push(stored[key]);
      recency.splice(position, 1);
      recency.unshift(key);
    } else {
      out.push(0);
      if (!capacity) continue;
      if (position >= 0) recency.splice(position, 1);
      recency.unshift(key);
      stored[key] = values[i];
      if (recency.length > capacity) {
        const evicted = recency.pop();
        delete stored[evicted];
      }
    }
  }
  return out;
}
function histories() {
  const r = seeded(0x1112),
    out = [];
  for (let t = 0; t < 730; t++) {
    const n = (r() >>> 8) % 100,
      capacity = (r() >>> 8) % 9,
      commands = [],
      keys = [],
      values = [];
    for (let i = 0; i < n; i++) {
      commands.push((r() >>> 8) % 3 === 0 ? "get" : "put");
      keys.push((r() >>> 8) % 12);
      values.push((r() >>> 8) % 51);
    }
    out.push({
      input: { capacity, commands, keys, values },
      category: capacity
        ? "updates-get-refresh-and-eviction"
        : "zero-capacity-history",
    });
  }
  out.push({
    input: {
      capacity: 64,
      commands: Array.from({ length: 2000 }, (_, i) =>
        i % 3 === 0 ? "get" : "put",
      ),
      keys: Array.from({ length: 2000 }, (_, i) => i % 90),
      values: Array.from({ length: 2000 }, (_, i) => i),
    },
    category: "large-command-history",
  });
  return out;
}
export const preparations = [
  {
    id: "linked-list-09",
    step: 5,
    title: "Return the Josephus survivor node",
    objective:
      "Select the original surviving node in a circular elimination schedule without confusing its value with its identity.",
    contract:
      "Single native ring in IdentityList, exactly one head; remove each kth counted node, counting the head as1 and resuming with the following node. Return original survivor or null for empty ring. Original values/links remain unchanged.1≤k≤1,000,000,000.",
    visible: [
      {
        input: {
          data: { values: [7, 7, 7, 7, 7], next: [1, 2, 3, 4, 0], heads: [0] },
          k: 2,
        },
        expected: 2,
        explanation: "The removal order is1,3,0,4, leaving original node2.",
      },
      {
        input: { data: { values: [9], next: [0], heads: [0] }, k: 1000000000 },
        expected: 0,
        explanation: "A singleton survives regardless of count size.",
      },
      {
        input: { data: { values: [], next: [], heads: [null] }, k: 1 },
        expected: null,
        explanation: "An empty ring has no survivor.",
      },
    ],
    generate: rings,
    oracle: survivor,
    independent: removedSurvivor,
    mutations: {
      "count-one-too-far": (input) => survivor({ ...input, k: input.k + 1 }),
      "value-as-original-identity": (input) => {
        const id = survivor(input);
        return id === null
          ? null
          : input.data.values.indexOf(input.data.values[id]);
      },
    },
  },
  {
    id: "linked-list-10",
    step: 5,
    title: "Weave the front and back original nodes",
    objective:
      "Relink original nodes in first,last,second,second-last order without replacing equal-valued nodes or changing their values.",
    contract:
      "Native finite ListNode input, native ListNodeIdentitySequence output; preserve every original node once and preserve its original value. Empty input returns null. The displayed sequence is original node indices.",
    visible: [
      {
        input: { head: [8, 8, 8, 8] },
        expected: [0, 3, 1, 2],
        explanation:
          "Equal-valued nodes are still reordered by their original identities.",
      },
      {
        input: { head: [4, 9, -2, 7, 5] },
        expected: [0, 4, 1, 3, 2],
        explanation: "The middle node appears once at the end.",
      },
      {
        input: { head: [] },
        expected: [],
        explanation: "No input node means an empty result chain.",
      },
    ],
    generate: () => lists(0x1110),
    oracle: alternate,
    independent: alternateQueue,
    mutations: {
      "reverse-all-nodes": ({ head }) =>
        head.map((_, i) => head.length - 1 - i),
      "leave-original-order": ({ head }) => head.map((_, i) => i),
    },
  },
  {
    id: "linked-list-11",
    step: 5,
    title: "Stably sort the original nodes",
    objective:
      "Order original nodes by nondecreasing value while preserving the original relative order of equal-valued nodes.",
    contract:
      "Native ListNode input/output with ListNodeIdentitySequence checking; every original node appears once, values remain unchanged, and equal-value node identities retain input order. Target O(n log n) time.",
    visible: [
      {
        input: { head: [3, 1, 3, 1] },
        expected: [1, 3, 0, 2],
        explanation:
          "Both1nodes and both3nodes retain their relative input order.",
      },
      {
        input: { head: [-2, -2, -2] },
        expected: [0, 1, 2],
        explanation:
          "Sorting equal values cannot exchange their original identities.",
      },
      {
        input: { head: [] },
        expected: [],
        explanation: "The empty list is already sorted.",
      },
    ],
    generate: () => lists(0x1111),
    oracle: stableIndices,
    independent: stableMerge,
    mutations: {
      "unstable-equal-keys": ({ head }) =>
        head
          .map((value, index) => ({ value, index }))
          .sort((a, b) => a.value - b.value || b.index - a.index)
          .map((x) => x.index),
      "sort-descending": ({ head }) =>
        head
          .map((value, index) => ({ value, index }))
          .sort((a, b) => b.value - a.value || a.index - b.index)
          .map((x) => x.index),
    },
  },
  {
    id: "linked-list-12",
    step: 5,
    title: "Replay an LRU cache history",
    objective:
      "Maintain cache recency across reads, inserts, updates, and evictions, including a zero-capacity cache.",
    contract:
      "Typed parallel commands/keys/values arrays of equal length. Commands are exactly get or put. put emits0; get emits stored value or-1 for absent key. Keys/values are nonnegative, so-1 unambiguously means missing.0≤capacity≤2,000; at most2,000commands. get and updating put both refresh recency. Target O(1) expected work per operation using lookup and linked recency.",
    visible: [
      {
        input: {
          capacity: 2,
          commands: ["put", "put", "get", "put", "get", "get"],
          keys: [1, 2, 1, 3, 2, 3],
          values: [10, 20, 0, 30, 0, 0],
        },
        expected: [0, 0, 10, 0, -1, 30],
        explanation: "Reading1 refreshes it, so inserting3 evicts2.",
      },
      {
        input: {
          capacity: 0,
          commands: ["put", "get"],
          keys: [4, 4],
          values: [9, 0],
        },
        expected: [0, -1],
        explanation: "A zero-capacity cache stores nothing.",
      },
      {
        input: {
          capacity: 1,
          commands: ["put", "put", "get", "get"],
          keys: [1, 1, 1, 2],
          values: [4, 7, 0, 0],
        },
        expected: [0, 0, 7, -1],
        explanation:
          "Updating1 replaces its value without creating another entry.",
      },
    ],
    generate: histories,
    oracle: lruMap,
    independent: lruArray,
    mutations: {
      "get-does-not-refresh": (input) => lruMap(input, false),
      "evict-when-updating-existing": (input) => lruMap(input, true, true),
    },
  },
];
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope: "LL09–12 trusted candidate/oracle preparation only",
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
        report.failures.push(p.id + ": mismatch");
    const mutations = Object.entries(p.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) =>
          JSON.stringify(fn(c.input)) !== JSON.stringify(p.oracle(c.input)),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(p.id + ": live mutation " + m.name);
    report.prepared.push({
      id: p.id,
      candidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-advanced-preparation.json",
    JSON.stringify(report, null, 2),
  );
  console.log(report);
  if (report.failures.length) process.exitCode = 1;
}
if (process.argv[1]?.endsWith("linked-list-advanced-preparation.mjs")) audit();
