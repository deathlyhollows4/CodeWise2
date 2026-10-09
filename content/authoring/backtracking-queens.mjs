import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function queens(
  { allowed, fixed },
  ignoreDiagonals = false,
  ignoreFixed = false,
) {
  const n = allowed.length,
    out = [],
    path = [];
  function visit(row, columns, left, right) {
    if (row === n) {
      out.push([...path]);
      return;
    }
    for (let col = 0; col < n; col++) {
      const bit = 1 << col,
        a = 1 << (row + col),
        b = 1 << (row - col + n - 1);
      if (
        !allowed[row][col] ||
        (!ignoreFixed && fixed[row] !== -1 && fixed[row] !== col) ||
        columns & bit ||
        (!ignoreDiagonals && (left & a || right & b))
      )
        continue;
      path.push(col);
      visit(row + 1, columns | bit, left | a, right | b);
      path.pop();
    }
  }
  visit(0, 0, 0, 0);
  return out;
}
function permutationOracle({ allowed, fixed }) {
  const n = allowed.length,
    out = [],
    p = Array.from({ length: n }, (_, i) => i);
  while (true) {
    let valid = true;
    for (let row = 0; row < n && valid; row++) {
      if (
        !allowed[row][p[row]] ||
        (fixed[row] !== -1 && fixed[row] !== p[row])
      ) {
        valid = false;
        break;
      }
      for (let prev = 0; prev < row; prev++)
        if (Math.abs(p[row] - p[prev]) === row - prev) {
          valid = false;
          break;
        }
    }
    if (valid) out.push([...p]);
    let i = n - 2;
    while (i >= 0 && p[i] >= p[i + 1]) i--;
    if (i < 0) break;
    let j = n - 1;
    while (p[j] <= p[i]) j--;
    [p[i], p[j]] = [p[j], p[i]];
    for (let a = i + 1, b = n - 1; a < b; a++, b--) [p[a], p[b]] = [p[b], p[a]];
  }
  return out;
}
const open = (n) => Array.from({ length: n }, () => Array(n).fill(1));
const visible = [
  {
    input: { allowed: open(4), fixed: [-1, -1, -1, -1] },
    expected: [
      [1, 3, 0, 2],
      [2, 0, 3, 1],
    ],
    explanation:
      "These are the two nonattacking arrangements on an unrestricted four-by-four board.",
  },
  {
    input: { allowed: open(4), fixed: [0, -1, -1, -1] },
    expected: [],
    explanation:
      "Fixing the first queen at column 0 rules out both valid four-by-four arrangements.",
  },
  {
    input: { allowed: [], fixed: [] },
    expected: [[]],
    explanation: "The empty board has one empty arrangement.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(allowed, fixed, category) {
    const input = { allowed, fixed },
      key = JSON.stringify(input);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ input, category });
  }
  for (let n = 1; n <= 8; n++)
    add(open(n), Array(n).fill(-1), "full-domain-by-board-size");
  add([[0]], [-1], "single-blocked");
  add([[1]], [0], "single-fixed");
  const solution = [0, 4, 7, 5, 2, 6, 1, 3];
  add(open(8), solution, "maximum-fully-fixed-valid");
  add(open(8), [0, 0, -1, -1, -1, -1, -1, -1], "maximum-fixed-column-conflict");
  add(
    open(8),
    [0, 1, -1, -1, -1, -1, -1, -1],
    "maximum-fixed-diagonal-conflict",
  );
  for (let row = 0; row < 8; row++) {
    const allowed = open(8);
    allowed[row].fill(0);
    add(allowed, Array(8).fill(-1), "each-maximum-row-entirely-blocked");
  }
  for (let row = 0; row < 8; row++) {
    const fixed = Array(8).fill(-1);
    fixed[row] = solution[row];
    add(open(8), fixed, "each-original-row-single-fixed-valid");
  }
  const mismatch = open(8);
  mismatch[0][solution[0]] = 0;
  add(mismatch, solution, "fixed-queen-on-blocked-square");
  const random = seeded(0xb709);
  let serial = 0;
  while (out.length < 60) {
    const n = 4 + (serial % 5),
      allowed = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => Number((random() >>> 12) % 7 < 5)),
      ),
      fixed = Array(n).fill(-1);
    if (serial % 3 === 0)
      for (let row = 0; row < n; row++)
        if ((random() >>> 12) % 3 === 0) fixed[row] = (random() >>> 12) % n;
    if (serial % 3 === 1) {
      const solutions = queens({ allowed: open(n), fixed });
      if (solutions.length) {
        const witness = solutions[(random() >>> 12) % solutions.length];
        for (let row = 0; row < n; row++) {
          allowed[row][witness[row]] = 1;
          if (row % 3 === serial % 3) fixed[row] = witness[row];
        }
      }
    }
    add(
      allowed,
      fixed,
      [
        "blocked-board-with-fixed-constraints",
        "guaranteed-feasible-through-blocking",
        "blocked-board-search",
      ][serial % 3],
    );
    serial++;
  }
  return out;
}
const fn = {
    arguments: [
      { name: "allowed", type: "int[][]" },
      { name: "fixed", type: "int[]" },
    ],
    returnType: "int[][]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-09",
    slug: "enumerate-blocked-and-fixed-queen-arrangements",
    title: "Place queens around blocked and fixed squares",
    primaryTopic: "backtracking",
    step: 5,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.multi-constraint-state",
      "backtracking.diagonal-constraints",
    ],
    prerequisites: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
    ],
    remedialIds: ["backtracking-04", "backtracking-07"],
    checkpointIds: ["backtracking-10"],
    nextIds: [],
    objective:
      "Enumerate nonattacking placements with blocked squares and immutable row-specific queen constraints.",
    rationale:
      "Diagonal attack scopes and blocked/fixed squares create a substantive constrained-board domain; distinct inputs are not renamed unconstrained n-only queens instances.",
    statement:
      "## Respect the board and the fixed queens\n\nPlace one queen in every row of the n×n board. `allowed[row][column]` is 1 for an available square and 0 for a blocked square. `fixed[row]` is −1 when that row has no fixed queen; otherwise it is the column where that row must place its queen. A fixed queen on a blocked square makes the instance impossible. Fixed constraints that attack each other also make it impossible.\n\nNo two queens may share a column or either diagonal. Return every valid arrangement as an array of n columns: the entry at row r is that row’s queen column. Sort arrangement rows lexicographically by these column arrays. Return an empty array when no arrangement exists. The empty board has one empty arrangement, `[[]]`.\n\n### Native interface\n\n`solve(allowed, fixed)` receives a native square integer matrix and a native integer array of equal length, returning an integer matrix. Columns and rows use zero-based indices. Do not alter the board or relax a fixed constraint.",
    constraints: [
      "0 ≤ n ≤ 8.",
      "allowed is an n×n matrix with entries 0 or 1.",
      "fixed has length n and each entry is −1 or a column in [0,n−1].",
      "Queens must occupy available squares and obey every nonnegative fixed entry.",
      "Columns and both diagonals must be distinct; all answers use one queen per row.",
      "At most 92 arrangements exist on any supported unrestricted board.",
    ],
    interface:
      "Solution.solve(allowed:int[][],fixed:int[]) returns ordered int[][] column arrangements.",
    inputSchema: {
      kind: "object",
      properties: {
        allowed: {
          kind: "array",
          maxLength: 8,
          rectangular: true,
          items: {
            kind: "array",
            maxLength: 8,
            items: { kind: "integer", minimum: 0, maximum: 1 },
          },
        },
        fixed: {
          kind: "array",
          maxLength: 8,
          items: { kind: "integer", minimum: -1, maximum: 7 },
        },
      },
    },
    semanticConstraints: [
      { kind: "matrix-square", field: "allowed" },
      { kind: "lengths-equal", left: "allowed", right: "fixed" },
      {
        kind: "range-by-length",
        field: "fixed",
        array: "allowed",
        minimum: -1,
        maxOffset: -1,
      },
    ],
    valid: ({ allowed, fixed }) =>
      allowed.length === fixed.length &&
      allowed.every((row) => row.length === allowed.length) &&
      fixed.every((col) => col === -1 || (col >= 0 && col < allowed.length)),
    outputSchema: {
      kind: "array",
      maxLength: 92,
      items: {
        kind: "array",
        maxLength: 8,
        items: { kind: "integer", minimum: 0, maximum: 7 },
      },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-queens.mjs",
    generate: cases,
    oracle: queens,
    independent: permutationOracle,
    visible,
    mutations: {
      "ignore-diagonal-attacks": (i) => queens(i, true),
      "ignore-fixed-queens": (i) => queens(i, false, true),
      "ignore-blocked-squares": (i) =>
        queens({ ...i, allowed: open(i.allowed.length) }),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {int[][] allowed;int[] fixed,path;ArrayList<int[]> out;void visit(int row,int columns,int left,int right){int n=allowed.length;if(row==n){out.add(path.clone());return;}for(int col=0;col<n;col++){int bit=1<<col,a=1<<(row+col),b=1<<(row-col+n-1);if(allowed[row][col]==0||(fixed[row]!=-1&&fixed[row]!=col)||(columns&bit)!=0||(left&a)!=0||(right&b)!=0)continue;path[row]=col;visit(row+1,columns|bit,left|a,right|b);}}public int[][] solve(int[][] allowed,int[] fixed){this.allowed=allowed;this.fixed=fixed;path=new int[allowed.length];out=new ArrayList<>();visit(0,0,0,0);return out.toArray(new int[0][]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<vector<int>> solve(vector<vector<int>> allowed,vector<int> fixed){int n=allowed.size();vector<vector<int>> out;vector<int> path(n);function<void(int,int,int,int)> visit=[&](int row,int columns,int left,int right){if(row==n){out.push_back(path);return;}for(int col=0;col<n;col++){int bit=1<<col,a=1<<(row+col),b=1<<(row-col+n-1);if(!allowed[row][col]||(fixed[row]!=-1&&fixed[row]!=col)||(columns&bit)||(left&a)||(right&b))continue;path[row]=col;visit(row+1,columns|bit,left|a,right|b);}};visit(0,0,0,0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          "class Solution:\n    def solve(self, allowed, fixed):\n        n=len(allowed)\n        out=[]\n        path=[]\n        def visit(row,columns,left,right):\n            if row==n:\n                out.append(list(path))\n                return\n            for col in range(n):\n                bit=1<<col\n                a=1<<(row+col)\n                b=1<<(row-col+n-1)\n                if not allowed[row][col] or (fixed[row]!=-1 and fixed[row]!=col) or columns&bit or left&a or right&b:\n                    continue\n                path.append(col)\n                visit(row+1,columns|bit,left|a,right|b)\n                path.pop()\n        visit(0,0,0,0)\n        return out\n",
      },
    },
  },
];
export function audit() {
  const d = definitions[0],
    hidden = cases(),
    seen = new Set(visible.map((c) => JSON.stringify(c.input))),
    failures = [];
  let bytes = 0,
    feasible = 0,
    max = 0;
  for (const c of [...hidden, ...visible]) {
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input) ||
      !d.valid(c.input)
    )
      failures.push("input rejection");
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
    if (!validateInput(d.outputSchema, out)) failures.push("output rejection");
    bytes += Buffer.byteLength(JSON.stringify(out) + "\n");
    if (out.length) feasible++;
    max = Math.max(max, out.length);
  }
  if (hidden.length !== 60 || max !== 92) failures.push("exact60/max missing");
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
      "Trusted JS independent models/template sources only; no native execution",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRetainedAnswers: max,
    outputBytes: bytes,
    conservativeStdoutBytes: bytes + 512 * 63,
    conservativeEnvelopeBytes: 2 * (bytes + 512 * 63) + 65536,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-queens-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-queens-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-queens.mjs")) audit();
