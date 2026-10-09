import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { writeFileSync } from "node:fs";
function complete({ clues }, ignoreBlocks = false) {
  const grid = clues.map((r) => [...r]),
    row = Array(4).fill(0),
    col = Array(4).fill(0),
    box = Array(4).fill(0),
    out = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const bit = 1 << v,
        b = 2 * Math.floor(r / 2) + Math.floor(c / 2);
      if (row[r] & bit || col[c] & bit || (!ignoreBlocks && box[b] & bit))
        return [];
      row[r] |= bit;
      col[c] |= bit;
      box[b] |= bit;
    }
  function visit(at) {
    if (at === 16) {
      out.push(grid.map((r) => r.join("")));
      return;
    }
    const r = Math.floor(at / 4),
      c = at % 4,
      b = 2 * Math.floor(r / 2) + Math.floor(c / 2);
    if (grid[r][c]) {
      visit(at + 1);
      return;
    }
    for (let v = 1; v <= 4; v++) {
      const bit = 1 << v;
      if (row[r] & bit || col[c] & bit || (!ignoreBlocks && box[b] & bit))
        continue;
      grid[r][c] = v;
      row[r] |= bit;
      col[c] |= bit;
      box[b] |= bit;
      visit(at + 1);
      row[r] ^= bit;
      col[c] ^= bit;
      box[b] ^= bit;
      grid[r][c] = 0;
    }
  }
  visit(0);
  return out;
}
function permutations(a) {
  if (!a.length) return [[]];
  const out = [];
  for (let i = 0; i < a.length; i++)
    for (const tail of permutations(a.filter((_, j) => i !== j)))
      out.push([a[i], ...tail]);
  return out;
}
let allBoards;
function rowOracle({ clues }) {
  if (!allBoards) {
    const rows = permutations([1, 2, 3, 4]);
    allBoards = [];
    for (const a of rows)
      for (const b of rows) {
        if ([0, 1, 2, 3].some((c) => a[c] === b[c])) continue;
        if (
          new Set([a[0], a[1], b[0], b[1]]).size !== 4 ||
          new Set([a[2], a[3], b[2], b[3]]).size !== 4
        )
          continue;
        for (const c of rows) {
          if ([0, 1, 2, 3].some((k) => a[k] === c[k] || b[k] === c[k]))
            continue;
          for (const d of rows) {
            if (
              [0, 1, 2, 3].some(
                (k) => new Set([a[k], b[k], c[k], d[k]]).size !== 4,
              )
            )
              continue;
            if (
              new Set([c[0], c[1], d[0], d[1]]).size !== 4 ||
              new Set([c[2], c[3], d[2], d[3]]).size !== 4
            )
              continue;
            allBoards.push([a, b, c, d].map((r) => r.join("")));
          }
        }
      }
    allBoards.sort((a, b) => a.join("").localeCompare(b.join("")));
  }
  return allBoards.filter((board) =>
    clues.every((row, r) =>
      row.every((v, c) => !v || Number(board[r][c]) === v),
    ),
  );
}
const solved = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ],
  blank = () => Array.from({ length: 4 }, () => Array(4).fill(0));
const visible = [
  {
    input: {
      clues: solved.map((row, r) =>
        row.map((v, c) => (r === 3 && c === 3 ? 0 : v)),
      ),
    },
    expected: [["1234", "3412", "2143", "4321"]],
    explanation: "The single missing value is 1, preserving every fixed clue.",
  },
  {
    input: {
      clues: [
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    },
    expected: [],
    explanation:
      "The first row repeats a fixed 1; no completion can repair that contradiction.",
  },
  {
    input: { clues: solved },
    expected: [["1234", "3412", "2143", "4321"]],
    explanation: "A completed valid grid is its own one completion.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(clues, category) {
    const input = { clues },
      key = JSON.stringify(input);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ input, category });
    return true;
  }
  add(blank(), "maximum-all-288-completions");
  for (const [a, b] of [
    [0, 4],
    [0, 5],
    [2, 7],
    [8, 12],
    [8, 13],
    [10, 15],
    [0, 3],
    [5, 6],
  ]) {
    const clues = blank();
    clues[Math.floor(a / 4)][a % 4] = 1;
    clues[Math.floor(b / 4)][b % 4] = 1;
    add(clues, "fixed-row-column-or-block-contradiction");
  }
  const latin = [
    [1, 2, 3, 4],
    [2, 3, 4, 1],
    [3, 4, 1, 2],
    [4, 1, 2, 3],
  ];
  add(latin, "valid-rows-columns-but-invalid-blocks");
  for (let at = 0; at < 16; at++) {
    const clues = solved.map((r) => [...r]);
    clues[Math.floor(at / 4)][at % 4] = 0;
    add(clues, "one-missing-fixed-location");
  }
  const masks = [
    0x000f, 0x00ff, 0x5555, 0xaaaa, 0x8421, 0x1248, 0x3333, 0xcccc, 0x0f0f,
    0xf0f0, 0x0001, 0x8000, 0x1008, 0x9009,
  ];
  for (const mask of masks)
    add(
      solved.map((row, r) =>
        row.map((v, c) => (mask & (1 << (4 * r + c)) ? v : 0)),
      ),
      "sparse-line-block-diagonal-clue-shape",
    );
  const random = seeded(0xb707);
  while (out.length < 60) {
    const mask = (random() >>> 8) & 0xffff;
    add(
      solved.map((row, r) =>
        row.map((v, c) => (mask & (1 << (4 * r + c)) ? v : 0)),
      ),
      "distinct-clue-location-mask",
    );
  }
  return out;
}
const fn = {
    arguments: [{ name: "clues", type: "int[][]" }],
    returnType: "string[][]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-07",
    slug: "enumerate-four-by-four-block-constrained-grid-completions",
    title: "Complete a four-by-four constraint grid",
    primaryTopic: "backtracking",
    step: 4,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.multi-constraint-state",
    ],
    prerequisites: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
    ],
    remedialIds: ["backtracking-04"],
    checkpointIds: ["backtracking-08"],
    nextIds: ["backtracking-09", "backtracking-10"],
    objective:
      "Enumerate complete grids under intersecting row, column and block constraints while respecting all fixed clues.",
    rationale:
      "Each choice updates several shared constraint scopes. Distinct clue-location masks exercise propagation, ambiguity and contradiction rather than renaming an unconstrained puzzle.",
    statement:
      "## Four digits in each scope\n\nComplete the 4×4 grid using digits 1 through 4. A zero in `clues` is an empty cell; every nonzero clue is fixed. Each row, each column, and each of the four 2×2 blocks must contain every digit exactly once. Contradictory fixed clues are valid input, but their answer is an empty array.\n\nReturn every valid completed grid. Represent one grid by four row strings, each containing four digits. Sort the completed grids lexicographically by their 16 row-major digits. Do not change a fixed clue or return a partial grid. If the input is already complete and valid, return it as the one answer.\n\n### Native interface\n\n`solve(clues)` receives a native integer matrix and returns a native string matrix: the outer array lists solutions, and each solution has its four row strings. There is no JSON parsing task. Restore row, column and block state when a search branch finishes.",
    constraints: [
      "clues has exactly 4 rows and 4 columns.",
      "Every entry lies in [0,4]; 0 means empty.",
      "The four blocks occupy rows 0–1 or 2–3 and columns 0–1 or 2–3.",
      "At most 288 completed grids exist, attained by the entirely empty grid.",
      "Preserve every nonzero clue; contradictions produce no solution.",
    ],
    interface:
      "Solution.solve(clues:int[][]) returns string[][]; each solution is four row strings.",
    inputSchema: {
      kind: "object",
      properties: {
        clues: {
          kind: "array",
          minLength: 4,
          maxLength: 4,
          items: {
            kind: "array",
            minLength: 4,
            maxLength: 4,
            items: { kind: "integer", minimum: 0, maximum: 4 },
          },
        },
      },
    },
    outputSchema: {
      kind: "array",
      maxLength: 288,
      items: {
        kind: "array",
        minLength: 4,
        maxLength: 4,
        items: { kind: "string", minLength: 4, maxLength: 4, ascii: true },
      },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-mini-grid.mjs",
    generate: cases,
    oracle: complete,
    independent: rowOracle,
    visible,
    mutations: {
      "ignore-two-by-two-blocks": (i) => complete(i, true),
      "discard-fixed-clues": () => complete({ clues: blank() }),
      "return-only-first-solution": (i) => complete(i).slice(0, 1),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {int[][] grid;int[] row,col,box;ArrayList<String[]> out;void visit(int at){if(at==16){String[] board=new String[4];for(int r=0;r<4;r++){StringBuilder s=new StringBuilder();for(int c=0;c<4;c++)s.append(grid[r][c]);board[r]=s.toString();}out.add(board);return;}int r=at/4,c=at%4,b=2*(r/2)+c/2;if(grid[r][c]!=0){visit(at+1);return;}for(int v=1;v<=4;v++){int bit=1<<v;if(((row[r]|col[c]|box[b])&bit)!=0)continue;grid[r][c]=v;row[r]|=bit;col[c]|=bit;box[b]|=bit;visit(at+1);row[r]^=bit;col[c]^=bit;box[b]^=bit;grid[r][c]=0;}}public String[][] solve(int[][] clues){grid=new int[4][4];row=new int[4];col=new int[4];box=new int[4];out=new ArrayList<>();for(int r=0;r<4;r++)for(int c=0;c<4;c++){int v=clues[r][c];grid[r][c]=v;if(v==0)continue;int bit=1<<v,b=2*(r/2)+c/2;if(((row[r]|col[c]|box[b])&bit)!=0)return new String[0][];row[r]|=bit;col[c]|=bit;box[b]|=bit;}visit(0);return out.toArray(new String[0][]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<vector<string>> solve(vector<vector<int>> clues){auto grid=clues;int row[4]={},col[4]={},box[4]={};vector<vector<string>> out;for(int r=0;r<4;r++)for(int c=0;c<4;c++){int v=grid[r][c];if(!v)continue;int bit=1<<v,b=2*(r/2)+c/2;if((row[r]|col[c]|box[b])&bit)return out;row[r]|=bit;col[c]|=bit;box[b]|=bit;}function<void(int)> visit=[&](int at){if(at==16){vector<string> board(4);for(int r=0;r<4;r++)for(int c=0;c<4;c++)board[r].push_back(char('0'+grid[r][c]));out.push_back(board);return;}int r=at/4,c=at%4,b=2*(r/2)+c/2;if(grid[r][c]){visit(at+1);return;}for(int v=1;v<=4;v++){int bit=1<<v;if((row[r]|col[c]|box[b])&bit)continue;grid[r][c]=v;row[r]|=bit;col[c]|=bit;box[b]|=bit;visit(at+1);row[r]^=bit;col[c]^=bit;box[b]^=bit;grid[r][c]=0;}};visit(0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          'class Solution:\n    def solve(self, clues):\n        grid=[list(row) for row in clues]\n        rows=[0]*4\n        cols=[0]*4\n        boxes=[0]*4\n        out=[]\n        for r in range(4):\n            for c in range(4):\n                v=grid[r][c]\n                if not v:\n                    continue\n                bit=1<<v\n                b=2*(r//2)+c//2\n                if (rows[r]|cols[c]|boxes[b])&bit:\n                    return []\n                rows[r]|=bit\n                cols[c]|=bit\n                boxes[b]|=bit\n        def visit(at):\n            if at==16:\n                out.append(["".join(map(str,row)) for row in grid])\n                return\n            r,c=divmod(at,4)\n            b=2*(r//2)+c//2\n            if grid[r][c]:\n                visit(at+1)\n                return\n            for v in range(1,5):\n                bit=1<<v\n                if (rows[r]|cols[c]|boxes[b])&bit:\n                    continue\n                grid[r][c]=v\n                rows[r]|=bit\n                cols[c]|=bit\n                boxes[b]|=bit\n                visit(at+1)\n                rows[r]^=bit\n                cols[c]^=bit\n                boxes[b]^=bit\n                grid[r][c]=0\n        visit(0)\n        return out\n',
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
    if (!validateInput(d.inputSchema, c.input))
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
  if (hidden.length !== 60 || max !== 288) failures.push("exact60/max missing");
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
      "Trusted author JS models/template sources only; native execution pending",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRows: max,
    distinctClueMasks: new Set(
      hidden.map((c) =>
        c.input.clues
          .flat()
          .map((v) => (v ? 1 : 0))
          .join(""),
      ),
    ).size,
    outputBytes: bytes,
    conservativeStdoutBytes: bytes + 512 * 63,
    conservativeEnvelopeBytes: 2 * (bytes + 512 * 63) + 65536,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-mini-grid-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-mini-grid-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-mini-grid.mjs")) audit();
