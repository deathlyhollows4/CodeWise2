import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
const lex = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
};
function digitWords({ digits, length, target }, uniqueOnly = false) {
  const choices = [...new Set(digits)].sort((a, b) => a - b),
    out = [],
    path = [];
  function visit(remaining, total) {
    if (!remaining) {
      if (total === target) out.push(path.join(""));
      return;
    }
    if (total > target || !choices.length) return;
    for (const value of choices) {
      if (uniqueOnly && path.includes(value)) continue;
      path.push(value);
      visit(remaining - 1, total + value);
      path.pop();
    }
  }
  visit(length, 0);
  return out;
}
function digitCartesian({ digits, length, target }) {
  const choices = [...new Set(digits)].sort((a, b) => a - b),
    out = [],
    count = choices.length ** length;
  for (let code = 0; code < count; code++) {
    let cursor = code,
      total = 0;
    const path = Array(length);
    for (let at = length - 1; at >= 0; at--) {
      const value = choices[cursor % choices.length];
      path[at] = value;
      total += value;
      cursor = Math.floor(cursor / choices.length);
    }
    if (total === target) out.push(path.join(""));
  }
  return out;
}
function combinations({ values, k, target }, positivePrune = false) {
  const out = [],
    path = [];
  function visit(start, needed, total) {
    if (!needed) {
      if (total === target) out.push([...path]);
      return;
    }
    if (positivePrune && total > target) return;
    for (let index = start; index <= values.length - needed; index++) {
      path.push(index);
      visit(index + 1, needed - 1, total + values[index]);
      path.pop();
    }
  }
  visit(0, k, 0);
  return out;
}
function subsets({ values, k, target }, ignoreK = false) {
  const out = [];
  for (let mask = 0; mask < 2 ** values.length; mask++) {
    let count = 0,
      total = 0;
    const ids = [];
    for (let i = 0; i < values.length; i++)
      if (mask & (1 << i)) {
        count++;
        total += values[i];
        ids.push(i);
      }
    if ((ignoreK || count === k) && total === target) out.push(ids);
  }
  return out.sort(lex);
}
function digitCases() {
  const random = seeded(0xb701),
    out = [];
  for (let test = 0; test < 740; test++) {
    const pool = Array.from({ length: 10 }, (_, i) => i);
    for (let i = 9; i > 0; i--) {
      const j = random() % (i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const digits = pool.slice(0, 1 + (random() % 5)),
      length = 1 + (random() % 6);
    let target = 0;
    for (let i = 0; i < length; i++) target += digits[random() % digits.length];
    if (test % 7 === 0) target = -1 - (random() % 54);
    if (test % 13 === 0) digits.push(digits[0]);
    out.push({
      input: { digits, length, target },
      category:
        test % 7
          ? "feasible-value-constrained-sequence"
          : "negative-target-no-sequence",
    });
  }
  for (const input of [
    { digits: [], length: 0, target: 0 },
    { digits: [0, 1], length: 0, target: 1 },
    { digits: [0, 1], length: 0, target: -1 },
    { digits: [], length: 3, target: 0 },
    { digits: [0], length: 6, target: 0 },
    { digits: [1], length: 6, target: 0 },
    { digits: [1], length: 6, target: 6 },
    { digits: [0, 9], length: 6, target: 18 },
  ])
    out.push({ input, category: "empty-leading-zero-reuse-and-no-solution" });
  const digits = Array.from({ length: 10 }, (_, i) => i);
  for (let length = 1; length <= 6; length++)
    for (const target of [0, 9 * length, Math.floor((9 * length) / 2)])
      out.push({
        input: { digits, length, target },
        category:
          target === 27 && length === 6
            ? "single-max-coefficient-case"
            : "bounded-all-digit-extremes",
      });
  return out;
}
function subsetCases() {
  const random = seeded(0xb702),
    out = [];
  for (let test = 0; test < 720; test++) {
    const n = random() % 15,
      values = Array.from({ length: n }, () => (random() % 19) - 9),
      k = n ? random() % (n + 1) : 0,
      indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = random() % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    let target = indices.slice(0, k).reduce((sum, i) => sum + values[i], 0);
    if (test % 11 === 0 && k === 0) target = 1;
    out.push({
      input: { values, k, target },
      category: k
        ? "signed-position-subset-feasible"
        : "empty-cardinality-distinction",
    });
  }
  for (const input of [
    { values: [], k: 0, target: 0 },
    { values: [], k: 0, target: -1 },
    { values: [4, -3], k: 2, target: 1 },
    { values: [2, 2, 2], k: 2, target: 4 },
    { values: Array(14).fill(0), k: 7, target: 0 },
    { values: Array(14).fill(1000000000), k: 14, target: 14000000000 },
    { values: Array(14).fill(-1000000000), k: 14, target: -14000000000 },
  ])
    out.push({
      input,
      category: "maximum-cardinality-zero-and-wide-signed-total",
    });
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
export const definitions = [
  {
    id: "backtracking-01",
    slug: "all-fixed-sum-allowed-digit-strings",
    title: "Build every fixed-sum digit string",
    primaryTopic: "backtracking",
    step: 1,
    skillIds: [
      "arrays.traversal",
      "backtracking.branch-restoration",
      "backtracking.fixed-depth-choices",
      "backtracking.nonnegative-remainder-pruning",
    ],
    prerequisites: ["arrays.traversal"],
    remedialIds: ["arrays-hashing-01"],
    checkpointIds: ["backtracking-02"],
    nextIds: ["backtracking-03", "backtracking-04"],
    objective:
      "Enumerate every fixed-length ordered string from an allowed digit set whose digit sum equals the target.",
    rationale:
      "Each position is an independent reusable choice, while restoring the partial path separates siblings; order and leading zeroes remain significant.",
    statement:
      '## Ordered digit strings with an exact sum\n\nReturn every string of exactly `length` digits chosen from `digits` whose digit sum equals `target`. A digit may be reused at any position. Duplicate entries in digits have no extra effect. Return distinct strings in ascending lexicographic order.\n\nThese are strings, not numeric values: keep leading zeroes, and distinguish different orders such as "12" and "21". For length zero and target zero, return one empty string, [""]. Length zero with any other target returns an empty array. When length is positive and digits is empty, no string exists. Digits are nonnegative, so a negative target has no solution.\n\n`solve(digits,length,target)` receives a native integer array and two integers, returning string[]. No number parsing is required. A partial string whose accumulated sum already exceeds a nonnegative target can be pruned.',
    constraints: [
      "0 ≤ digits.length ≤ 10; every entry is an integer from 0 to 9.",
      "0 ≤ length ≤ 6.",
      "-54 ≤ target ≤ 54.",
      "At most 55,252 answers exist for any valid input; order and leading zeroes are part of each answer.",
    ],
    interface:
      "Solution.solve(digits,length,target) receives int[] and integers, returns sorted string[].",
    inputSchema: {
      kind: "object",
      properties: {
        digits: {
          kind: "array",
          maxLength: 10,
          unordered: true,
          deduplicate: true,
          items: { kind: "integer", minimum: 0, maximum: 9 },
        },
        length: { kind: "integer", minimum: 0, maximum: 6 },
        target: { kind: "integer", minimum: -54, maximum: 54 },
      },
    },
    semanticConstraints: [],
    outputSchema: {
      kind: "array",
      maxLength: 55252,
      items: { kind: "string", maxLength: 6, ascii: true },
    },
    function: {
      arguments: [
        { name: "digits", type: "int[]" },
        { name: "length", type: "int" },
        { name: "target", type: "int" },
      ],
      returnType: "string[]",
    },
    generatorModule: "content/authoring/backtracking-first.mjs",
    generate: digitCases,
    oracle: digitWords,
    independent: digitCartesian,
    visible: [
      {
        input: { digits: [0, 1], length: 2, target: 1 },
        expected: ["01", "10"],
        explanation:
          "Leading zeroes are kept, and both orders meet the same sum.",
      },
      {
        input: { digits: [1, 1, 2], length: 2, target: 3 },
        expected: ["12", "21"],
        explanation:
          "The duplicated allowed digit 1 does not duplicate answers.",
      },
      {
        input: { digits: [], length: 0, target: 0 },
        expected: [""],
        explanation: "There is exactly one empty sequence with sum zero.",
      },
    ],
    mutations: {
      "forbid-leading-zero-strings": (input) =>
        digitWords(input).filter((word) => word.length < 2 || word[0] !== "0"),
      "forbid-reusing-a-digit": (input) => digitWords(input, true),
      "treat-order-as-an-unordered-combination": (input) =>
        [
          ...new Set(
            digitWords(input).map((word) => [...word].sort().join("")),
          ),
        ].sort(),
    },
    languages: refs(
      "class Solution {int[] choices;int target;ArrayList<String> answers;StringBuilder path;void visit(int remaining,int sum){if(remaining==0){if(sum==target)answers.add(path.toString());return;}if(sum>target)return;for(int value:choices){path.append((char)('0'+value));visit(remaining-1,sum+value);path.setLength(path.length()-1);}}public String[] solve(int[] digits,int length,int target){choices=Arrays.stream(digits).distinct().sorted().toArray();this.target=target;answers=new ArrayList<>();path=new StringBuilder();visit(length,0);return answers.toArray(new String[0]);}}",
      "class Solution {public:vector<string> solve(vector<int> digits,int length,int target){sort(digits.begin(),digits.end());digits.erase(unique(digits.begin(),digits.end()),digits.end());vector<string> answers;string path;function<void(int,int)> visit=[&](int remaining,int sum){if(remaining==0){if(sum==target)answers.push_back(path);return;}if(sum>target)return;for(int value:digits){path.push_back(char('0'+value));visit(remaining-1,sum+value);path.pop_back();}};visit(length,0);return answers;}};",
      'class Solution:\n    def solve(self, digits, length, target):\n        choices=sorted(set(digits))\n        answers=[]\n        path=[]\n        def visit(remaining,total):\n            if remaining==0:\n                if total==target:\n                    answers.append("".join(path))\n                return\n            if total>target:\n                return\n            for value in choices:\n                path.append(str(value))\n                visit(remaining-1,total+value)\n                path.pop()\n        visit(length,0)\n        return answers\n',
    ),
  },
  {
    id: "backtracking-02",
    slug: "signed-target-exact-cardinality-index-combinations",
    title: "Choose an exact-size index combination with a signed total",
    primaryTopic: "backtracking",
    step: 1,
    skillIds: [
      "arrays.traversal",
      "numbers.signed-accumulation",
      "backtracking.branch-restoration",
      "backtracking.exact-cardinality-combination",
      "backtracking.original-index-choice",
    ],
    prerequisites: ["arrays.traversal", "numbers.signed-accumulation"],
    remedialIds: ["arrays-hashing-01"],
    checkpointIds: ["backtracking-01"],
    nextIds: ["backtracking-03", "backtracking-04"],
    objective:
      "Enumerate original-position subsets of exactly k entries having the target signed total, keeping equal-valued positions distinct.",
    rationale:
      "Increasing index choices prevent repeated positions/permutations, while signed values make a positive-only overshoot prune invalid.",
    statement:
      "## Exact cardinality and signed total\n\nReturn every combination of exactly k distinct original indices whose values sum to target. An entry can be selected at most once. Indices are zero-based. Write each combination in increasing index order, and sort the answer combinations lexicographically by those index lists. Equal values at different positions remain different choices.\n\nValues may be negative or zero. Do not discard a branch merely because its current sum exceeds target; a later negative value may restore the required total. For k=0 and target=0, return one empty combination, [[]]. For k=0 and any other target, return an empty array.\n\n`solve(values,k,target)` receives a native integer array, an integer cardinality and a wide signed target, returning int[][]. Return index combinations, not just a feasibility flag, count, or list of selected values. Accumulate totals with a wide integer.",
    constraints: [
      "0 ≤ values.length ≤ 14.",
      "Each value lies in [-1,000,000,000,1,000,000,000].",
      "0 ≤ k ≤ values.length.",
      "-14,000,000,000 ≤ target ≤ 14,000,000,000.",
      "At most 3,432 combinations exist; preserve original positions and deterministic index ordering.",
    ],
    interface:
      "Solution.solve(values,k,target) receives int[],int,long / long long and returns sorted int[][].",
    inputSchema: {
      kind: "object",
      properties: {
        values: {
          kind: "array",
          maxLength: 14,
          items: { kind: "integer", minimum: -1000000000, maximum: 1000000000 },
        },
        k: { kind: "integer", minimum: 0, maximum: 14 },
        target: {
          kind: "integer",
          minimum: -14000000000,
          maximum: 14000000000,
        },
      },
    },
    semanticConstraints: [
      {
        kind: "length-relative",
        field: "k",
        array: "values",
        minimum: 0,
        maxOffset: 0,
      },
    ],
    valid: ({ values, k }) => k <= values.length,
    outputSchema: {
      kind: "array",
      maxLength: 3432,
      items: {
        kind: "array",
        maxLength: 14,
        items: { kind: "integer", minimum: 0, maximum: 13 },
      },
    },
    function: {
      arguments: [
        { name: "values", type: "int[]" },
        { name: "k", type: "int" },
        { name: "target", type: "long" },
      ],
      returnType: "int[][]",
    },
    generatorModule: "content/authoring/backtracking-first.mjs",
    generate: subsetCases,
    oracle: combinations,
    independent: subsets,
    visible: [
      {
        input: { values: [2, 2, 2], k: 2, target: 4 },
        expected: [
          [0, 1],
          [0, 2],
          [1, 2],
        ],
        explanation:
          "Three distinct original-position pairs have equal value totals; do not collapse them by value.",
      },
      {
        input: { values: [4, -3], k: 2, target: 1 },
        expected: [[0, 1]],
        explanation:
          "The first selected value overshoots target, but the later negative value completes the required total.",
      },
      {
        input: { values: [], k: 0, target: 0 },
        expected: [[]],
        explanation: "One empty index set has cardinality zero and total zero.",
      },
    ],
    mutations: {
      "positive-only-overshoot-prune": (input) => combinations(input, true),
      "ignore-exact-cardinality": (input) => subsets(input, true),
      "collapse-equal-valued-position-choices": (input) => {
        const seen = new Set();
        return combinations(input).filter((ids) => {
          const key = JSON.stringify(ids.map((i) => input.values[i]));
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      },
    },
    languages: refs(
      "class Solution {int[] values;long target;ArrayList<int[]> answers;ArrayList<Integer> path;void visit(int start,int needed,long total){if(needed==0){if(total==target)answers.add(path.stream().mapToInt(Integer::intValue).toArray());return;}for(int index=start;index<=values.length-needed;index++){path.add(index);visit(index+1,needed-1,total+values[index]);path.remove(path.size()-1);}}public int[][] solve(int[] values,int k,long target){this.values=values;this.target=target;answers=new ArrayList<>();path=new ArrayList<>();visit(0,k,0);return answers.toArray(new int[0][]);}}",
      "class Solution {public:vector<vector<int>> solve(vector<int> values,int k,long long target){vector<vector<int>> answers;vector<int> path;function<void(int,int,long long)> visit=[&](int start,int needed,long long total){if(needed==0){if(total==target)answers.push_back(path);return;}for(int index=start;index<=(int)values.size()-needed;index++){path.push_back(index);visit(index+1,needed-1,total+values[index]);path.pop_back();}};visit(0,k,0);return answers;}};",
      "class Solution:\n    def solve(self, values, k, target):\n        answers=[]\n        path=[]\n        def visit(start,needed,total):\n            if needed==0:\n                if total==target:\n                    answers.append(list(path))\n                return\n            for index in range(start,len(values)-needed+1):\n                path.append(index)\n                visit(index+1,needed-1,total+values[index])\n                path.pop()\n        visit(0,k,0)\n        return answers\n",
    ),
  },
];
for (const d of definitions) {
  const starters = buildFunctionStarters(d.function);
  for (const language of ["java", "cpp", "python"])
    d.languages[language].starter = starters[language];
}
export function audit() {
  let coefficients = [1],
    maximumDigitAnswers = 1;
  const digitCoefficientProof = [];
  for (let length = 0; length <= 6; length++) {
    if (length) {
      const next = Array(coefficients.length + 9).fill(0);
      for (let sum = 0; sum < coefficients.length; sum++)
        for (let digit = 0; digit < 10; digit++)
          next[sum + digit] += coefficients[sum];
      coefficients = next;
    }
    const max = Math.max(...coefficients);
    maximumDigitAnswers = Math.max(maximumDigitAnswers, max);
    digitCoefficientProof.push({
      length,
      maxAnswers: max,
      peakSums: coefficients.flatMap((count, sum) =>
        count === max ? [sum] : [],
      ),
    });
  }
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Backtracking01/02 trusted source/oracle/capacity audit; no native reference execution",
    maximumDigitAnswers,
    digitCoefficientProof,
    prepared: [],
    failures: [],
  };
  if (maximumDigitAnswers !== 55252)
    report.failures.push("Digit coefficient capacity mismatch");
  for (const d of definitions) {
    const hidden = logicalCases(d);
    let aggregateOutputBytes = 0,
      feasibleNondegenerate = 0;
    for (const c of [...d.visible, ...hidden]) {
      const expected = d.oracle(c.input);
      if (
        !validateSemantics(d.semanticConstraints, c.input) ||
        !validateInput(d.outputSchema, expected)
      )
        report.failures.push(d.id + ": semantic/output schema rejection");
      if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
        report.failures.push(d.id + ": independent mismatch");
      if (
        c.expected !== undefined &&
        JSON.stringify(expected) !== JSON.stringify(c.expected)
      )
        report.failures.push(d.id + ": expected mismatch");
      aggregateOutputBytes += Buffer.byteLength(
        JSON.stringify(expected) + "\n",
      );
      if (
        expected.length &&
        (d.id === "backtracking-01" ? c.input.length > 0 : c.input.k > 0)
      )
        feasibleNondegenerate++;
    }
    const conservativeStdoutBytes =
        aggregateOutputBytes + 512 * (hidden.length + 3),
      conservativeEnvelopeBytes = 2 * conservativeStdoutBytes + 65536;
    if (
      conservativeStdoutBytes > 4 * 1024 * 1024 ||
      conservativeEnvelopeBytes > 6 * 1024 * 1024
    )
      report.failures.push(d.id + ": aggregate capacity exceeded");
    if (feasibleNondegenerate < 200)
      report.failures.push(
        d.id + ": fewer than200 feasible nondegenerate cases",
      );
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
      feasibleNondegenerate,
      aggregateOutputBytes,
      conservativeStdoutBytes,
      conservativeEnvelopeBytes,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-backtracking-first-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-first-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-first.mjs")) audit();
