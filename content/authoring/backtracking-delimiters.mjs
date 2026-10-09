import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { writeFileSync } from "node:fs";
function completions({ pattern }, ignoreFixed = false, ignorePrefix = false) {
  const out = [],
    path = [];
  function visit(at, balance) {
    if (at === pattern.length) {
      if (balance === 0) out.push(path.join(""));
      return;
    }
    if (!ignorePrefix && (balance < 0 || balance > pattern.length - at)) return;
    for (const c of ["(", ")"])
      if (ignoreFixed || pattern[at] === "?" || pattern[at] === c) {
        path.push(c);
        visit(at + 1, balance + (c === "(" ? 1 : -1));
        path.pop();
      }
  }
  visit(0, 0);
  return out;
}
function assignmentOracle({ pattern }) {
  const slots = [];
  for (let i = 0; i < pattern.length; i++)
    if (pattern[i] === "?") slots.push(i);
  const out = [];
  for (let mask = 0; mask < 2 ** slots.length; mask++) {
    const s = [...pattern];
    for (let i = 0; i < slots.length; i++)
      s[slots[i]] = mask & (1 << i) ? ")" : "(";
    const open = [];
    let valid = true;
    for (const c of s) {
      if (c === "(") open.push(c);
      else if (!open.length) {
        valid = false;
        break;
      } else open.pop();
    }
    if (valid && !open.length) out.push(s.join(""));
  }
  return out.sort();
}
const visible = [
  {
    input: { pattern: "??" },
    expected: ["()"],
    explanation:
      "Each question mark becomes exactly one parenthesis; the only balanced completion is () .",
  },
  {
    input: { pattern: "(?))" },
    expected: ["(())"],
    explanation:
      "The fixed first and final characters are preserved; the second position must become an opening parenthesis.",
  },
  {
    input: { pattern: "" },
    expected: [""],
    explanation: "The empty string is balanced and has one empty completion.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(pattern, category) {
    const input = { pattern },
      key = JSON.stringify(input);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ input, category });
  }
  for (const p of [
    "?",
    "???",
    "(",
    ")",
    "()",
    "(())",
    "()()",
    "())(",
    "))((",
    "??????????????????",
    "?????????????????",
    "((((((((()))))))))",
    "()()()()()()()()()",
    ")?????????????????",
    "?????????????????(",
    "((((((((((((((((((",
    "))))))))))))))))))",
    "(????????????????)",
    "??????????))))))))",
    "((((((((??????????",
    "????????????????",
    "??????????????",
    "????????????",
    "??????????",
    "????????",
    "??????",
    "????",
    "(?)(?)",
    "?()?",
    "??()??",
    "(()??)",
    "????))",
    "((????",
    "?))?",
    "(?))??",
    "(?(?))",
    "()????()",
    "??((??))??",
  ])
    add(p, "empty-fixed-prefix-parity-max-and-branch-boundary");
  const random = seeded(0xb706);
  let serial = 0;
  while (out.length < 60) {
    const length = 8 + 2 * (serial % 6);
    let pattern = "";
    for (let i = 0; i < length; i++) {
      const x = (random() >>> 12) % 5;
      pattern += x < 3 ? "?" : x === 3 ? "(" : ")";
    }
    add(
      pattern,
      serial % 2 ? "mixed-fixed-boundaries" : "mixed-fixed-branch-constraints",
    );
    serial++;
  }
  return out;
}
const fn = {
    arguments: [{ name: "pattern", type: "string" }],
    returnType: "string[]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-06",
    slug: "complete-partially-fixed-balanced-parentheses",
    title: "Complete a partially fixed delimiter pattern",
    primaryTopic: "backtracking",
    step: 3,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.prefix-feasibility",
      "backtracking.remaining-capacity-pruning",
    ],
    prerequisites: ["backtracking.branch-restoration"],
    remedialIds: ["backtracking-01", "backtracking-02"],
    checkpointIds: ["backtracking-05"],
    nextIds: ["backtracking-07", "backtracking-08"],
    objective:
      "Enumerate all balanced completions while respecting fixed symbols and pruning irrecoverable prefixes.",
    rationale:
      "A partially constrained pattern creates meaningful distinct search domains. Prefix feasibility and remaining capacity eliminate branches that cannot be repaired, unlike unconstrained n-only enumeration.",
    statement:
      '## Keep the fixed delimiters\n\nThe pattern contains only `(`, `)`, and `?`. Replace each question mark with exactly one opening or closing parenthesis. Preserve every fixed character. Return all resulting balanced strings, in lexicographic order. A string is balanced when every prefix contains at least as many opening as closing parentheses and the total counts are equal.\n\nA question mark cannot disappear, become several characters, or turn into a different bracket type. Return an empty array if no completion exists. The empty pattern has one empty completion, `[""]`. An odd-length pattern has no balanced completion.\n\n### Native interface\n\n`solve(pattern)` receives a native string and returns a string array. Restore the current path when returning from a branch. Think about both a negative current balance and an opening balance too large for the remaining positions to close.',
    constraints: [
      "0 ≤ pattern.length ≤ 18.",
      "Every character is one of (, ), or ?.",
      "Each ? is replaced by exactly one parenthesis; all fixed characters remain unchanged.",
      "At most Catalan(9) = 4,862 balanced strings exist at the maximum length.",
      "Return every valid completion once, sorted lexicographically.",
    ],
    interface: "Solution.solve(pattern:string) returns ordered string[].",
    inputSchema: {
      kind: "object",
      properties: { pattern: { kind: "string", maxLength: 18, ascii: true } },
    },
    semanticConstraints: [
      { kind: "alphabet", field: "pattern", alphabet: "parentheses-wildcard" },
    ],
    valid: ({ pattern }) => /^[()?]*$/.test(pattern),
    outputSchema: {
      kind: "array",
      maxLength: 4862,
      items: { kind: "string", maxLength: 18, ascii: true },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-delimiters.mjs",
    generate: cases,
    oracle: completions,
    independent: assignmentOracle,
    visible,
    mutations: {
      "ignore-fixed-symbols": (i) => completions(i, true),
      "only-check-final-balance": (i) => completions(i, false, true),
      "reverse-answer-order": (i) => completions(i).reverse(),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {String pattern;StringBuilder path;ArrayList<String> out;void visit(int at,int balance){if(at==pattern.length()){if(balance==0)out.add(path.toString());return;}if(balance<0||balance>pattern.length()-at)return;for(char c:new char[]{'(',')'})if(pattern.charAt(at)=='?'||pattern.charAt(at)==c){path.append(c);visit(at+1,balance+(c=='('?1:-1));path.setLength(path.length()-1);}}public String[] solve(String pattern){this.pattern=pattern;path=new StringBuilder();out=new ArrayList<>();visit(0,0);return out.toArray(new String[0]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<string> solve(string pattern){vector<string> out;string path;function<void(int,int)> visit=[&](int at,int balance){if(at==(int)pattern.size()){if(balance==0)out.push_back(path);return;}if(balance<0||balance>(int)pattern.size()-at)return;for(char c:string(\"()\"))if(pattern[at]=='?'||pattern[at]==c){path.push_back(c);visit(at+1,balance+(c=='('?1:-1));path.pop_back();}};visit(0,0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          'class Solution:\n    def solve(self, pattern):\n        out=[]\n        path=[]\n        def visit(at,balance):\n            if at==len(pattern):\n                if balance==0:\n                    out.append("".join(path))\n                return\n            if balance<0 or balance>len(pattern)-at:\n                return\n            for char in "()":\n                if pattern[at]=="?" or pattern[at]==char:\n                    path.append(char)\n                    visit(at+1,balance+(1 if char=="(" else -1))\n                    path.pop()\n        visit(0,0)\n        return out\n',
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
    maxRows = 0,
    feasible = 0;
  for (const c of [...hidden, ...visible]) {
    if (!validateInput(d.inputSchema, c.input) || !d.valid(c.input))
      failures.push("invalid input");
    if (hidden.includes(c)) {
      const key = JSON.stringify(c.input);
      if (seen.has(key)) failures.push("duplicate hidden");
      seen.add(key);
    }
    const out = d.oracle(c.input);
    if (JSON.stringify(out) !== JSON.stringify(d.independent(c.input)))
      failures.push("oracle mismatch");
    if (c.expected && JSON.stringify(out) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (!validateInput(d.outputSchema, out)) failures.push("output rejection");
    outputBytes += Buffer.byteLength(JSON.stringify(out) + "\n");
    maxRows = Math.max(maxRows, out.length);
    if (out.length) feasible++;
  }
  if (hidden.length !== 60 || maxRows !== 4862)
    failures.push("exact60/max missing");
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
    failures.push("aggregate output budget");
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted JS models/template sources only; new alphabet runtime guard and native reference execution pending",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRows,
    outputBytes,
    conservativeStdoutBytes: stdout,
    conservativeEnvelopeBytes: envelope,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-delimiters-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-delimiters-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-delimiters.mjs")) audit();
