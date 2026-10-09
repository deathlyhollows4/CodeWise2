import { materializePack, seeded } from "./pack-builder.mjs";
import { extraDefinitions } from "./sliding-window-extra.mjs";
import { retainedMaxCases } from "./owned-max-cases.mjs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const values = { kind: "array", minLength: 1, maxLength: 2000, items: integer };
const inputSchema = {
  kind: "object",
  properties: { values, k: { kind: "integer", minimum: 1, maximum: 2000 } },
};
const valid = ({ values, k }) => k <= values.length;
function windows() {
  const r = seeded(0x51de),
    out = [];
  for (let i = 0; i < 700; i++) {
    const n = 1 + ((r() >>> 16) % 22);
    const values = Array.from({ length: n }, () => ((r() >>> 16) % 41) - 20);
    out.push({
      input: { values, k: 1 + ((r() >>> 16) % n) },
      category: i % 2 ? "signed-fixed-window" : "duplicate-fixed-window",
    });
  }
  out.push(
    {
      input: { values: Array(2000).fill(-1000000), k: 2000 },
      category: "large-negative-total",
    },
    {
      input: { values: Array.from({ length: 2000 }, (_, i) => i), k: 999 },
      category: "large-moving-window",
    },
  );
  return out;
}
function bestSum({ values, k }) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += values[i];
  let best = sum;
  for (let right = k; right < values.length; right++) {
    sum += values[right] - values[right - k];
    best = Math.max(best, sum);
  }
  return best;
}
function bestDistinct({ values, k }) {
  const count = new Map();
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    count.set(values[i], (count.get(values[i]) || 0) + 1);
    if (i >= k) {
      const old = values[i - k],
        next = count.get(old) - 1;
      if (next) count.set(old, next);
      else count.delete(old);
    }
    if (i >= k - 1) best = Math.max(best, count.size);
  }
  return best;
}
const common = {
  primaryTopic: "sliding-window",
  generatorModule: "content/authoring/sliding-window.mjs",
  prerequisites: ["arrays.traversal"],
  step: 1,
  inputSchema,
  valid,
  generate: windows,
  function: {
    arguments: [
      { name: "values", type: "int[]" },
      { name: "k", type: "int" },
    ],
    returnType: "long",
  },
};
export const definitions = [
  {
    ...common,
    id: "sliding-window-01",
    slug: "best-fixed-batch-total",
    title: "Best fixed batch total",
    skillIds: ["windows.fixed-boundaries", "windows.rolling-sum"],
    objective:
      "Update a fixed-length total by removing the old left value and adding the new right value.",
    rationale:
      "Reuse one total when the window moves, instead of summing every batch from scratch.",
    checkpointIds: ["sliding-window-02"],
    nextIds: ["sliding-window-03"],
    statement:
      "Consider every contiguous batch of exactly `k` integers in `values`. Return the largest batch total. A batch cannot skip positions and must contain exactly `k` values. All totals can be negative; still return the greatest of those negative totals.\n\nA fixed window is a consecutive part of the array with an unchanged length.",
    constraints: [
      "1 ≤ values.length ≤ 2,000",
      "1 ≤ k ≤ values.length",
      "Every value is in [-1,000,000, 1,000,000].",
      "Return the mathematical total using a 64-bit integer type where needed.",
    ],
    interface: "Solution.solve(values,k) returns a signed integer total.",
    outputSchema: { kind: "safe-integer" },
    visible: [
      {
        input: { values: [3, -2, 5, 1], k: 2 },
        expected: 6,
        explanation: "Totals are 1, 3, and 6; the final pair is best.",
      },
      {
        input: { values: [-4], k: 1 },
        expected: -4,
        explanation: "The only batch is negative and must be returned.",
      },
      {
        input: { values: [-8, -3, -5], k: 2 },
        expected: -8,
        explanation:
          "Choose -3 + -5 = -8, rather than incorrectly starting the answer at zero.",
      },
    ],
    oracle: bestSum,
    independent: ({ values, k }) => {
      let best = -Infinity;
      for (let left = 0; left + k <= values.length; left++) {
        let total = 0;
        for (let offset = 0; offset < k; offset++)
          total += values[left + offset];
        best = Math.max(best, total);
      }
      return best;
    },
    mutations: {
      "initialize-answer-zero": (input) => Math.max(0, bestSum(input)),
      "omit-final-window": ({ values, k }) =>
        values.length === k
          ? values.reduce((s, v) => s + v, 0)
          : bestSum({ values: values.slice(0, -1), k }),
    },
    languages: {
      java: {
        starter:
          "class Solution {public long solve(int[] values,int k){return 0L;}}",
        reference:
          "class Solution {public long solve(int[] values,int k){long total=0;for(int i=0;i<k;i++)total+=values[i];long best=total;for(int right=k;right<values.length;right++){total+=(long)values[right]-values[right-k];best=Math.max(best,total);}return best;}}",
      },
      cpp: {
        starter:
          "class Solution {public:long long solve(vector<int> values,int k){return 0;}};",
        reference:
          "class Solution {public:long long solve(vector<int> values,int k){long long total=0;for(int i=0;i<k;i++)total+=values[i];long long best=total;for(int right=k;right<(int)values.size();right++){total+=(long long)values[right]-values[right-k];best=max(best,total);}return best;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values, k):\n        return 0\n",
        reference:
          "class Solution:\n    def solve(self, values, k):\n        total=sum(values[:k])\n        best=total\n        for right in range(k,len(values)):\n            total+=values[right]-values[right-k]\n            best=max(best,total)\n        return best\n",
      },
    },
  },
  {
    ...common,
    id: "sliding-window-02",
    slug: "fixed-batch-variety",
    title: "Most variety in a fixed batch",
    step: 2,
    skillIds: ["windows.frequency-removal", "hashing.counts"],
    prerequisites: ["windows.fixed-boundaries", "hashing.membership"],
    objective:
      "Maintain distinct-value count while duplicate readings enter and leave a window.",
    rationale:
      "The window boundary is familiar. Keep counts so removing one copy does not remove a value still present.",
    checkpointIds: ["sliding-window-01"],
    nextIds: ["sliding-window-03"],
    statement:
      "For every contiguous batch containing exactly `k` integers, count its different values. Return the largest such count. Multiple copies of one value contribute only one different value. Values outside the batch do not contribute. Negative numbers are ordinary values.",
    constraints: [
      "1 ≤ values.length ≤ 2,000",
      "1 ≤ k ≤ values.length",
      "Every integer is in [-1,000,000, 1,000,000].",
    ],
    interface:
      "Solution.solve(values,k) returns an integer distinct-value count.",
    outputSchema: { kind: "integer", minimum: 1, maximum: 2000 },
    function: {
      arguments: [
        { name: "values", type: "int[]" },
        { name: "k", type: "int" },
      ],
      returnType: "int",
    },
    visible: [
      {
        input: { values: [1, 1, 2, 3, 2], k: 3 },
        expected: 3,
        explanation: "The batch [1,2,3] has three different values.",
      },
      {
        input: { values: [-7], k: 1 },
        expected: 1,
        explanation: "A single reading contains one value.",
      },
      {
        input: { values: [4, 4, 4, 4], k: 2 },
        expected: 1,
        explanation: "Each batch has two copies but only one different value.",
      },
    ],
    oracle: bestDistinct,
    independent: ({ values, k }) => {
      let best = 0;
      for (let i = 0; i + k <= values.length; i++)
        best = Math.max(best, new Set(values.slice(i, i + k)).size);
      return best;
    },
    mutations: {
      "count-whole-array": ({ values }) => new Set(values).size,
      "treat-duplicates-as-new": ({ k }) => k,
    },
    languages: {
      java: {
        starter:
          "class Solution {public int solve(int[] values,int k){return 0;}}",
        reference:
          "class Solution {public int solve(int[] values,int k){HashMap<Integer,Integer> counts=new HashMap<>();int best=0;for(int i=0;i<values.length;i++){counts.put(values[i],counts.getOrDefault(values[i],0)+1);if(i>=k){int old=values[i-k],next=counts.get(old)-1;if(next==0)counts.remove(old);else counts.put(old,next);}if(i>=k-1)best=Math.max(best,counts.size());}return best;}}",
      },
      cpp: {
        starter:
          "class Solution {public:int solve(vector<int> values,int k){return 0;}};",
        reference:
          "class Solution {public:int solve(vector<int> values,int k){unordered_map<int,int> counts;int best=0;for(int i=0;i<(int)values.size();i++){counts[values[i]]++;if(i>=k){int old=values[i-k];if(--counts[old]==0)counts.erase(old);}if(i>=k-1)best=max(best,(int)counts.size());}return best;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values, k):\n        return 0\n",
        reference:
          "class Solution:\n    def solve(self, values, k):\n        counts={}\n        best=0\n        for i,value in enumerate(values):\n            counts[value]=counts.get(value,0)+1\n            if i>=k:\n                old=values[i-k]\n                counts[old]-=1\n                if counts[old]==0:\n                    del counts[old]\n            if i>=k-1:\n                best=max(best,len(counts))\n        return best\n",
      },
    },
  },
];
for (const def of definitions)
  def.semanticConstraints = [
    {
      kind: "length-relative",
      field: "k",
      array: "values",
      minimum: 1,
      maxOffset: 0,
    },
  ];
definitions[1].step = 1;
definitions[0].nextIds = ["sliding-window-03"];
definitions[1].nextIds = ["sliding-window-03"];
definitions.push(...extraDefinitions);
const windowById = new Map(definitions.map((def) => [def.id, def]));
windowById.get("sliding-window-02").remedialIds = [
  "sliding-window-01",
  "arrays-hashing-03",
];
windowById.get("sliding-window-03").remedialIds = [
  "sliding-window-01",
  "arrays-hashing-03",
];
windowById.get("sliding-window-04").remedialIds = [
  "sliding-window-03",
  "arrays-hashing-03",
];
for (const id of [
  "sliding-window-06",
  "sliding-window-07",
  "sliding-window-08",
  "sliding-window-09",
])
  windowById.get(id).remedialIds = ["sliding-window-02", "sliding-window-03"];
windowById.get("sliding-window-08").remedialIds = [
  "sliding-window-01",
  "stack-04",
];
windowById.get("sliding-window-10").remedialIds = [
  "sliding-window-02",
  "sliding-window-03",
];
windowById.get("sliding-window-11").remedialIds = [
  "sliding-window-02",
  "sliding-window-03",
];
windowById.get("sliding-window-12").remedialIds = ["sliding-window-08"];

// R21: this task tests every fixed k-entry boundary while adding/removing frequencies.
if (
  !windowById
    .get("sliding-window-02")
    .skillIds.includes("windows.fixed-boundaries")
)
  windowById.get("sliding-window-02").skillIds.push("windows.fixed-boundaries");

// R21 common skills are backed by actual window-contribution removal and deque traces.
if (
  !windowById.get("sliding-window-09").skillIds.includes("windows.positive-sum")
)
  windowById.get("sliding-window-09").skillIds.push("windows.positive-sum");
if (
  !windowById
    .get("sliding-window-12")
    .skillIds.includes("windows.monotonic-deque")
)
  windowById.get("sliding-window-12").skillIds.push("windows.monotonic-deque");
for (const id of [
  "sliding-window-06",
  "sliding-window-07",
  "sliding-window-10",
  "sliding-window-11",
]) {
  if (!windowById.get(id).skillIds.includes("windows.frequency-removal"))
    windowById.get(id).skillIds.push("windows.frequency-removal");
  windowById.get(id).checkpointIds = [
    "sliding-window-06",
    "sliding-window-07",
    "sliding-window-10",
    "sliding-window-11",
  ].filter((peer) => peer !== id);
}

for (const def of definitions) {
  const prior = def.generate;
  def.generate = () => [...prior(), ...retainedMaxCases(def.id)];
}
if (process.argv[1]?.endsWith("sliding-window.mjs"))
  for (const def of definitions) console.log(await materializePack(def));
