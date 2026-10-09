import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function quantities({ values, stock, target }, unlimited = false) {
  const out = [],
    path = [];
  function visit(at, total) {
    if (at === values.length) {
      if (total === target) out.push([...path]);
      return;
    }
    for (
      let count = 0;
      count <=
      (unlimited
        ? Math.min(6, Math.max(0, Math.floor((target - total) / values[at])))
        : stock[at]);
      count++
    ) {
      const next = total + count * values[at];
      if (next > target) break;
      path.push(count);
      visit(at + 1, next);
      path.pop();
    }
  }
  visit(0, 0);
  return out;
}
function mixedRadix({ values, stock, target }) {
  const out = [];
  let domain = 1;
  for (const s of stock) domain *= s + 1;
  for (let code = 0; code < domain; code++) {
    let rest = code,
      total = 0;
    const path = [];
    for (let at = values.length - 1; at >= 0; at--) {
      const count = rest % (stock[at] + 1);
      rest = Math.floor(rest / (stock[at] + 1));
      path[at] = count;
      total += values[at] * count;
    }
    if (total === target) out.push(path);
  }
  return out;
}
const visible = [
  {
    input: { values: [2, 3], stock: [3, 2], target: 6 },
    expected: [
      [0, 2],
      [3, 0],
    ],
    explanation:
      "Either two units of value 3 or three units of value 2 reach the target. The rows are quantity vectors, not selection orders.",
  },
  {
    input: { values: [5], stock: [1], target: 10 },
    expected: [],
    explanation: "Two units would reach 10, but only one is in stock.",
  },
  {
    input: { values: [], stock: [], target: 0 },
    expected: [[]],
    explanation: "The empty quantity vector has total zero.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(input, category) {
    const key = JSON.stringify(input);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ input, category });
  }
  for (const input of [
    { values: [], stock: [], target: 1 },
    { values: [], stock: [], target: -1 },
    { values: [1], stock: [0], target: 0 },
    { values: [1], stock: [0], target: 1 },
    { values: [1], stock: [3], target: 3 },
    { values: [1], stock: [3], target: 4 },
    { values: [2], stock: [3], target: 3 },
    { values: [2], stock: [3], target: 0 },
    { values: [1, 2, 3], stock: [3, 3, 3], target: 6 },
    { values: [1, 2, 3], stock: [3, 3, 3], target: 7 },
    { values: [1, 2, 3, 4, 5, 6, 7], stock: [3, 3, 3, 3, 3, 3, 3], target: 42 },
    { values: [1, 2, 3, 4, 5, 6, 7], stock: [3, 3, 3, 3, 3, 3, 3], target: 84 },
    { values: [1, 2, 3, 4, 5, 6, 7], stock: [3, 3, 3, 3, 3, 3, 3], target: 85 },
    { values: [1, 2, 3, 4, 5, 6, 7], stock: [0, 0, 0, 0, 0, 0, 0], target: 0 },
    {
      values: [
        999999994, 999999995, 999999996, 999999997, 999999998, 999999999,
        1000000000,
      ],
      stock: [3, 3, 3, 3, 3, 3, 3],
      target: 20999999937,
    },
    { values: [999999999, 1000000000], stock: [3, 3], target: 5999999997 },
    { values: [1000000000], stock: [3], target: 3000000000 },
    { values: [1, 1000000000], stock: [3, 3], target: 3000000003 },
    {
      values: [2, 4, 6, 8, 10, 12, 14],
      stock: [3, 3, 3, 3, 3, 3, 3],
      target: 43,
    },
    { values: [1, 2, 3, 4, 5, 6, 7], stock: [3, 0, 3, 0, 3, 0, 3], target: 24 },
  ])
    add(input, "empty-stock-boundary-wide-target-and-composition");
  for (const target of [-21000000000, 21000000000])
    add(
      {
        values: [
          999999994, 999999995, 999999996, 999999997, 999999998, 999999999,
          1000000000,
        ],
        stock: [3, 3, 3, 3, 3, 3, 3],
        target,
      },
      "declared-wide-target-endpoint",
    );
  const random = seeded(0xb705);
  let serial = 0;
  while (out.length < 60) {
    const n = 2 + (serial % 6),
      values = Array.from({ length: n }, (_, i) => 1 + 2 * i + (serial % 7)),
      stock = values.map(() => (random() >>> 12) % 4);
    let target = 0;
    for (let i = 0; i < n; i++)
      target += values[i] * ((random() >>> 12) % (stock[i] + 1));
    if (serial % 4 === 0) target = -1 - (serial % 19);
    if (serial % 4 === 1)
      target = values.reduce((sum, v, i) => sum + v * stock[i], 0) + 1;
    add(
      { values, stock, target },
      [
        "negative-target",
        "above-total-stock",
        "feasible-bounded-quantities",
        "feasible-with-zero-stocks",
      ][serial % 4],
    );
    serial++;
  }
  return out;
}
const fn = {
    arguments: [
      { name: "values", type: "int[]" },
      { name: "stock", type: "int[]" },
      { name: "target", type: "long" },
    ],
    returnType: "int[][]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-05",
    slug: "enumerate-bounded-stock-target-quantity-vectors",
    title: "Build a target total from limited stock",
    primaryTopic: "backtracking",
    step: 3,
    skillIds: [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
      "backtracking.bounded-multiplicity",
      "backtracking.positive-target-pruning",
    ],
    prerequisites: [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
    ],
    remedialIds: ["backtracking-01", "backtracking-02"],
    checkpointIds: ["backtracking-06"],
    nextIds: ["backtracking-07", "backtracking-08"],
    objective:
      "Enumerate bounded multiplicity vectors for a wide target without inventing stock or duplicate orderings.",
    rationale:
      "Choices are quantities per distinct denomination, rather than original-position subsets or arbitrary reuse. Positive denominations justify pruning only when a partial total exceeds the target.",
    statement:
      "## A limited stock of denominations\n\nThe strictly increasing positive denominations `values` have available quantities in the parallel array `stock`. Return every quantity vector that reaches `target`: the count at position i must lie between zero and `stock[i]`, inclusive, and the sum of `values[i] * count[i]` must equal target.\n\nEach answer has one count for each denomination, including zero counts. Sort the answer vectors lexicographically by these counts. Different purchase orders with the same quantity vector are one answer. You cannot reuse more units than the stock allows. Negative targets have no answer. For target zero, the all-zero vector is the one answer; when both input arrays are empty this is `[[]]`.\n\n### Native interface\n\n`solve(values, stock, target)` receives two native integer arrays and a wide signed target, returning an integer matrix. The arrays have equal lengths. Accumulate products and totals in a wide integer; a legal total can exceed a 32-bit signed integer.",
    constraints: [
      "0 ≤ values.length = stock.length ≤ 7.",
      "Denominations are strictly increasing integers in [1,1,000,000,000].",
      "Every stock count lies in [0,3].",
      "−21,000,000,000 ≤ target ≤ 21,000,000,000.",
      "At most 4^7 = 16,384 quantity vectors can be explored; answer rows must preserve all denomination positions.",
    ],
    interface:
      "Solution.solve(values:int[],stock:int[],target:long / long long) returns sorted int[][].",
    inputSchema: {
      kind: "object",
      properties: {
        values: {
          kind: "array",
          maxLength: 7,
          items: { kind: "integer", minimum: 1, maximum: 1000000000 },
        },
        stock: {
          kind: "array",
          maxLength: 7,
          items: { kind: "integer", minimum: 0, maximum: 3 },
        },
        target: {
          kind: "integer",
          minimum: -21000000000,
          maximum: 21000000000,
        },
      },
    },
    semanticConstraints: [
      { kind: "sorted", field: "values" },
      { kind: "unique", field: "values" },
      { kind: "lengths-equal", left: "values", right: "stock" },
    ],
    valid: ({ values, stock }) =>
      values.length === stock.length &&
      values.every((v, i) => !i || values[i - 1] < v),
    outputSchema: {
      kind: "array",
      maxLength: 16384,
      items: {
        kind: "array",
        maxLength: 7,
        items: { kind: "integer", minimum: 0, maximum: 3 },
      },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-stock.mjs",
    generate: cases,
    oracle: quantities,
    independent: mixedRadix,
    visible,
    mutations: {
      "ignore-stock-cap": (i) => quantities(i, true),
      "use-32-bit-target": (i) => quantities({ ...i, target: i.target | 0 }),
      "omit-zero-denomination-counts": (i) =>
        quantities(i).map((row) => row.filter(Boolean)),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {int[] values,stock;long target;int[] path;ArrayList<int[]> out;void visit(int at,long total){if(at==values.length){if(total==target)out.add(path.clone());return;}for(int count=0;count<=stock[at];count++){long next=total+(long)count*values[at];if(next>target)break;path[at]=count;visit(at+1,next);}}public int[][] solve(int[] values,int[] stock,long target){this.values=values;this.stock=stock;this.target=target;path=new int[values.length];out=new ArrayList<>();visit(0,0L);return out.toArray(new int[0][]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<vector<int>> solve(vector<int> values,vector<int> stock,long long target){vector<vector<int>> out;vector<int> path(values.size());function<void(int,long long)> visit=[&](int at,long long total){if(at==(int)values.size()){if(total==target)out.push_back(path);return;}for(int count=0;count<=stock[at];count++){long long next=total+(long long)count*values[at];if(next>target)break;path[at]=count;visit(at+1,next);}};visit(0,0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          "class Solution:\n    def solve(self, values, stock, target):\n        out=[]\n        path=[]\n        def visit(at,total):\n            if at==len(values):\n                if total==target:\n                    out.append(list(path))\n                return\n            for count in range(stock[at]+1):\n                next_total=total+count*values[at]\n                if next_total>target:\n                    break\n                path.append(count)\n                visit(at+1,next_total)\n                path.pop()\n        visit(0,0)\n        return out\n",
      },
    },
  },
];
export function audit() {
  const d = definitions[0],
    hidden = cases(),
    seen = new Set(visible.map((c) => JSON.stringify(c.input))),
    failures = [];
  let outputBytes = 0,
    feasible = 0;
  for (const c of [...hidden, ...visible]) {
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input) ||
      !d.valid(c.input)
    )
      failures.push("input rejection " + JSON.stringify(c.input));
    if (hidden.includes(c)) {
      const key = JSON.stringify(c.input);
      if (seen.has(key)) failures.push("duplicate hidden");
      seen.add(key);
    }
    const out = d.oracle(c.input);
    if (JSON.stringify(out) !== JSON.stringify(d.independent(c.input)))
      failures.push("independent mismatch");
    if (c.expected && JSON.stringify(out) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (!validateInput(d.outputSchema, out))
      failures.push("output schema rejection");
    outputBytes += Buffer.byteLength(JSON.stringify(out) + "\n");
    if (out.length) feasible++;
  }
  if (hidden.length !== 60) failures.push("exact60");
  const mutations = Object.entries(d.mutations).map(([name, f]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(f(c.input)) !== JSON.stringify(d.oracle(c.input)),
    ),
  }));
  for (const m of mutations)
    if (!m.detected) failures.push("undetected " + m.name);
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted JS author models/template sources only; no native execution",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    outputBytes,
    maximumOutputJsonNodes: 1 + 16384 * 8,
    conservativeStdoutBytes: outputBytes + 512 * 63,
    conservativeEnvelopeBytes: 2 * (outputBytes + 512 * 63) + 65536,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-stock-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-stock-template-sources.json",
    JSON.stringify(
      { languages: d.languages, wrappers: buildFunctionHarness(d.function) },
      null,
      2,
    ),
  );
  console.log(report);
  if (failures.length) throw Error(JSON.stringify(failures));
  return report;
}
if (process.argv[1]?.endsWith("backtracking-stock.mjs")) audit();
