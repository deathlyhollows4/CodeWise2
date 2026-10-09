import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
const compare = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
function arrange({ allowed }, reuse = false, transpose = false) {
  const n = allowed.length,
    out = [],
    path = [],
    used = Array(n).fill(false);
  function visit() {
    const p = path.length;
    if (p === n) {
      out.push([...path]);
      return;
    }
    for (let id = 0; id < n; id++)
      if (
        (reuse || !used[id]) &&
        (transpose ? allowed[id][p] : allowed[p][id])
      ) {
        path.push(id);
        used[id] = true;
        visit();
        used[id] = false;
        path.pop();
      }
  }
  visit();
  return out;
}
function permutationOracle({ allowed }) {
  const n = allowed.length,
    p = Array.from({ length: n }, (_, i) => i),
    out = [];
  while (true) {
    if (p.every((id, pos) => allowed[pos][id] === 1)) out.push([...p]);
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
const matrix = (n, fn) =>
  Array.from({ length: n }, (_, p) =>
    Array.from({ length: n }, (_, id) => Number(Boolean(fn(p, id)))),
  );
const visible = [
  {
    input: {
      allowed: [
        [1, 1],
        [1, 1],
      ],
    },
    expected: [
      [0, 1],
      [1, 0],
    ],
    explanation:
      "Both original item IDs can occupy either position; each is used exactly once.",
  },
  {
    input: {
      allowed: [
        [1, 0, 0],
        [1, 0, 0],
        [0, 1, 1],
      ],
    },
    expected: [],
    explanation:
      "Each position permits some item, but the first two require the same single item, so no permutation exists.",
  },
  {
    input: { allowed: [] },
    expected: [[]],
    explanation:
      "There is one empty permutation for zero items and zero positions.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(allowed, category) {
    const input = { allowed },
      key = JSON.stringify(input);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ input, category });
    return true;
  }
  add([[0]], "single-blocked");
  add([[1]], "single-allowed");
  for (let mask = 0; mask < 16; mask++)
    add(
      matrix(2, (p, id) => mask & (1 << (p * 2 + id))),
      "complete-two-item-permission-domain",
    );
  add(
    matrix(7, () => true),
    "maximum-all-permutations-5040",
  );
  add(
    matrix(6, () => true),
    "all-permutations-720",
  );
  add(
    matrix(7, (p, id) => p === id),
    "maximum-one-identity-permutation",
  );
  add(
    matrix(7, (p, id) => id === 6 - p),
    "maximum-one-reversed-permutation",
  );
  add(
    matrix(7, (p, id) => p !== id),
    "maximum-derangements",
  );
  add(
    matrix(7, (p, id) => (p < 2 ? id === 0 : true)),
    "maximum-Hall-obstruction",
  );
  add(
    matrix(7, (p, id) => (p === 6 ? false : true)),
    "maximum-empty-position",
  );
  add(
    matrix(7, (p, id) => id !== 6),
    "maximum-unused-item-column",
  );
  add(
    matrix(7, (p, id) => id === p || id === (p + 1) % 7),
    "maximum-cycle-two-perfect-assignments",
  );
  add(
    matrix(7, (p, id) => (p < 3 ? id < 3 : id >= 3)),
    "independent-block-permutations",
  );
  const random = seeded(0xb704);
  let attempt = 0;
  while (out.length < 60) {
    const n = 3 + (attempt % 5),
      family = attempt % 4;
    attempt++;
    const allowed = matrix(
      n,
      () => (random() >>> 12) % 5 < (family === 0 ? 1 : 3),
    );
    if (family === 1) {
      const shift = attempt % n;
      for (let p = 0; p < n; p++) allowed[p][(p + shift) % n] = 1;
    }
    if (family === 2) allowed[n - 1].fill(0);
    if (family === 3 && n >= 4) {
      for (let p = 0; p < 3; p++)
        for (let id = 0; id < n; id++) allowed[p][id] = Number(id < 2);
    }
    add(
      allowed,
      [
        "sparse-asymmetric-position-permissions",
        "guaranteed-shifted-assignment",
        "explicit-empty-position",
        "multi-position-Hall-obstruction",
      ][family],
    );
  }
  return out;
}
const fn = {
    arguments: [{ name: "allowed", type: "int[][]" }],
    returnType: "int[][]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-04",
    slug: "enumerate-position-permitted-item-permutations",
    title: "Arrange items with position-specific permissions",
    primaryTopic: "backtracking",
    step: 2,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.position-constraints",
    ],
    prerequisites: ["backtracking.branch-restoration"],
    remedialIds: ["backtracking-01", "backtracking-02"],
    checkpointIds: ["backtracking-03"],
    nextIds: ["backtracking-05", "backtracking-06"],
    objective:
      "Enumerate complete bijections satisfying position-specific permissions, restoring both the path and used-item state between branches.",
    rationale:
      "A local permission does not guarantee global feasibility: multiple positions may compete for the same original item. This introduces constrained permutations and all-different state, distinct from signed subset enumeration.",
    statement:
      "## Position-specific permissions\n\nThere are n items, identified by the distinct original IDs 0 through n−1, and n positions. The square matrix `allowed` has one row per position and one column per item. A value of 1 means that item may occupy that position; 0 forbids it.\n\nReturn every full permutation of the item IDs satisfying all permissions. Every item must appear exactly once. Each returned row lists the item occupying positions 0, 1, …, n−1. Sort the result rows lexicographically by item IDs. Do not collapse items by any imagined value, reuse an item, or return only a count. For n=0, return one empty permutation, `[[]]`. If the permissions make a full assignment impossible, return an empty array.\n\n### Native interface\n\n`solve(allowed)` receives a native square integer matrix and returns an integer matrix. Permissions are read as `allowed[position][item]`, not in the reverse direction. Explore permitted choices while keeping used-item state private to the current branch.",
    constraints: [
      "0 ≤ n ≤ 7.",
      "allowed has exactly n rows and n columns; each entry is 0 or 1.",
      "Item IDs are distinct original positions from 0 through n−1.",
      "At most 7! = 5,040 permutations exist.",
      "Return rows in lexicographic order; the input permissions must remain unchanged.",
    ],
    interface:
      "Solution.solve(allowed: int[][]) returns lexicographically ordered int[][].",
    inputSchema: {
      kind: "object",
      properties: {
        allowed: {
          kind: "array",
          maxLength: 7,
          rectangular: true,
          items: {
            kind: "array",
            maxLength: 7,
            items: { kind: "integer", minimum: 0, maximum: 1 },
          },
        },
      },
    },
    semanticConstraints: [{ kind: "matrix-square", field: "allowed" }],
    valid: ({ allowed }) =>
      allowed.every((row) => row.length === allowed.length),
    outputSchema: {
      kind: "array",
      maxLength: 5040,
      items: {
        kind: "array",
        maxLength: 7,
        items: { kind: "integer", minimum: 0, maximum: 6 },
      },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-permissions.mjs",
    generate: cases,
    oracle: arrange,
    independent: permutationOracle,
    visible,
    mutations: {
      "reuse-permitted-items": (i) => arrange(i, true),
      "transpose-position-item-permissions": (i) => arrange(i, false, true),
      "reverse-enumeration-order": (i) => arrange(i).reverse(),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {int[][] allowed;boolean[] used;int[] path;ArrayList<int[]> out;void visit(int position){int n=allowed.length;if(position==n){out.add(path.clone());return;}for(int item=0;item<n;item++)if(!used[item]&&allowed[position][item]==1){used[item]=true;path[position]=item;visit(position+1);used[item]=false;}}public int[][] solve(int[][] allowed){this.allowed=allowed;used=new boolean[allowed.length];path=new int[allowed.length];out=new ArrayList<>();visit(0);return out.toArray(new int[0][]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<vector<int>> solve(vector<vector<int>> allowed){int n=allowed.size();vector<vector<int>> out;vector<int> path(n);vector<bool> used(n,false);function<void(int)> visit=[&](int position){if(position==n){out.push_back(path);return;}for(int item=0;item<n;item++)if(!used[item]&&allowed[position][item]==1){used[item]=true;path[position]=item;visit(position+1);used[item]=false;}};visit(0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          "class Solution:\n    def solve(self, allowed):\n        n=len(allowed)\n        out=[]\n        used=[False]*n\n        path=[]\n        def visit():\n            position=len(path)\n            if position==n:\n                out.append(list(path))\n                return\n            for item in range(n):\n                if not used[item] and allowed[position][item]==1:\n                    used[item]=True\n                    path.append(item)\n                    visit()\n                    path.pop()\n                    used[item]=False\n        visit()\n        return out\n",
      },
    },
  },
];
export function audit() {
  const d = definitions[0],
    hidden = cases(),
    seen = new Set(d.visible.map((c) => JSON.stringify(c.input))),
    failures = [];
  let outputBytes = 0,
    feasible = 0,
    maxRows = 0;
  for (const c of [...hidden, ...d.visible]) {
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input)
    )
      failures.push("invalid input");
    if (hidden.includes(c)) {
      const key = JSON.stringify(c.input);
      if (seen.has(key)) failures.push("non-distinct hidden");
      seen.add(key);
    }
    const expected = d.oracle(c.input);
    if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
      failures.push("independent mismatch");
    if (c.expected && JSON.stringify(expected) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (!validateInput(d.outputSchema, expected))
      failures.push("output schema rejection");
    outputBytes += Buffer.byteLength(JSON.stringify(expected) + "\n");
    if (expected.length) feasible++;
    maxRows = Math.max(maxRows, expected.length);
  }
  if (hidden.length !== 60 || maxRows !== 5040)
    failures.push("exact60/max output missing");
  const mutations = Object.entries(d.mutations).map(([name, f]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(f(c.input)) !== JSON.stringify(d.oracle(c.input)),
    ),
  }));
  for (const m of mutations)
    if (!m.detected) failures.push("undetected " + m.name);
  const stdout = outputBytes + 512 * 63,
    envelope = 2 * stdout + 65536;
  if (stdout > 4 * 1024 * 1024 || envelope > 6 * 1024 * 1024)
    failures.push("aggregate output exceeds bound");
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted JS models and template sources only; native execution pending",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRows,
    maximumOutputJsonNodes: 1 + 5040 * 8,
    outputBytes,
    conservativeStdoutBytes: stdout,
    conservativeEnvelopeBytes: envelope,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-permissions-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-permissions-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-permissions.mjs")) audit();
