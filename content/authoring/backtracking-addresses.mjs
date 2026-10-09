import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

function addresses({ digits }, allowZeros = false, allowLarge = false) {
  const out = [],
    path = [];
  function visit(at) {
    if (path.length === 4) {
      if (at === digits.length) out.push(path.join("."));
      return;
    }
    const slots = 4 - path.length,
      remaining = digits.length - at;
    if (remaining < slots || remaining > 3 * slots) return;
    for (let width = 1; width <= 3 && at + width <= digits.length; width++) {
      const part = digits.slice(at, at + width);
      if (!allowZeros && width > 1 && part[0] === "0") break;
      if (!allowLarge && Number(part) > 255) continue;
      path.push(part);
      visit(at + width);
      path.pop();
    }
  }
  visit(0);
  return out.sort();
}
function cutOracle({ digits }) {
  const out = [];
  for (let a = 1; a < digits.length; a++)
    for (let b = a + 1; b < digits.length; b++)
      for (let c = b + 1; c < digits.length; c++) {
        const parts = [
          digits.slice(0, a),
          digits.slice(a, b),
          digits.slice(b, c),
          digits.slice(c),
        ];
        if (
          parts.every(
            (p) => /^(0|[1-9][0-9]{0,2})$/.test(p) && Number(p) <= 255,
          )
        )
          out.push(parts.join("."));
      }
  return out.sort();
}
const fixtures = [
  ["", "empty"],
  ["0", "too-short"],
  ["000", "too-short"],
  ["00000", "leading-zero-rejection"],
  ["000000000000", "maximum-leading-zero-rejection"],
  ["1111", "minimum-four-segments"],
  ["1234", "minimum-four-segments"],
  ["256256256256", "maximum-out-of-range"],
  ["255255255255", "maximum-valid-octets"],
  ["2542550255", "zero-middle-boundary"],
  ["255255255256", "last-octet-overflow"],
  ["256255255255", "first-octet-overflow"],
  ["255256255255", "second-octet-overflow"],
  ["255255256255", "third-octet-overflow"],
  ["010010", "zero-split-ambiguity"],
  ["001001", "zero-split-ambiguity"],
  ["10101010", "repeated-zero-split"],
  ["10001000", "repeated-zero-split"],
  ["0001", "single-zero-octets"],
  ["1000", "single-zero-octets"],
  ["0010", "single-zero-octets"],
  ["111111111111", "maximum-valid-width"],
  ["222222222222", "maximum-valid-width"],
  ["333333333333", "maximum-no-valid-width"],
  ["999999999999", "maximum-no-valid-width"],
  ["11111", "multiple-length-compositions"],
  ["111111", "multiple-length-compositions"],
  ["1111111", "multiple-length-compositions"],
  ["11111111", "multiple-length-compositions"],
  ["111111111", "multiple-length-compositions"],
  ["1111111111", "multiple-length-compositions"],
  ["11111111111", "multiple-length-compositions"],
  ["25525511", "octet-boundary-ambiguity"],
  ["25425411", "octet-boundary-ambiguity"],
  ["25625611", "octet-boundary-ambiguity"],
  ["123123123123", "maximum-valid-width"],
  ["01010101", "zero-branch-restoration"],
  ["101023", "mixed-width-branching"],
  ["19216811", "realistic-address-ambiguity"],
  ["1721601", "realistic-zero-ambiguity"],
  ["127001", "realistic-zero-ambiguity"],
  ["100100100100", "maximum-zero-ending-octets"],
  ["200200200200", "maximum-zero-ending-octets"],
  ["249250251252", "maximum-near-boundary"],
  ["252253254255", "maximum-near-boundary"],
  ["109209309", "invalid-three-digit-branch"],
  ["21222324", "ambiguous-segment-widths"],
  ["9876543", "mixed-valid-invalid-width"],
  ["10100101", "prefix-zero-in-middle"],
  ["2002550255", "zero-and-high-octets"],
  ["25502550255", "interleaved-zero-octets"],
  ["123456789012", "maximum-invalid-width"],
  ["121212121212", "maximum-valid-width"],
  ["90909090", "two-digit-zero-ending-octets"],
  ["80808080", "two-digit-zero-ending-octets"],
  ["10111213", "ordered-mixed-widths"],
  ["10203040", "ordered-mixed-widths"],
  ["1002003004", "invalid-three-digit-pruning"],
  ["250251252253", "maximum-near-boundary"],
  ["0123456789", "leading-zero-with-long-tail"],
];
const functionSpec = {
  arguments: [{ name: "digits", type: "string" }],
  returnType: "string[]",
};
const starters = buildFunctionStarters(functionSpec);
export const definitions = [
  {
    id: "backtracking-03",
    slug: "restore-valid-ipv4-segmentations",
    title: "Restore every valid four-part address",
    primaryTopic: "backtracking",
    step: 2,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.segment-grammar",
      "backtracking.remaining-length-pruning",
    ],
    prerequisites: ["backtracking.branch-restoration"],
    remedialIds: ["backtracking-01", "backtracking-02"],
    checkpointIds: ["backtracking-04"],
    nextIds: ["backtracking-05", "backtracking-06"],
    objective:
      "Enumerate every valid segmentation under both segment grammar and remaining-length constraints.",
    rationale:
      "Choosing segment widths introduces grammar validation and admissible length pruning, rather than simply choosing a subset or arranging existing elements.",
    statement:
      '## Restore the separators\n\nYou receive a string containing only decimal digits. Insert exactly three dots to form four nonempty segments. Each segment must be a canonical decimal integer from 0 through 255: the single digit "0" is valid, but "00" and "01" are not. Use every input digit exactly once and preserve their order.\n\nReturn every valid dotted string, sorted lexicographically as strings. Do not return duplicate answers. Sorting is lexical, not sorting by the numeric octets. If no valid segmentation exists, return an empty array. The empty input also returns an empty array.\n\n### Native interface\n\n`solve(digits)` receives a native string and returns a string array. You do not parse network packets or validate a preformatted dotted address; the task is to choose the missing boundaries. Consider how many digits the remaining segments can consume before exploring a branch.',
    constraints: [
      "0 ≤ digits.length ≤ 12.",
      "Every input character is an ASCII decimal digit.",
      "Exactly four segments are required; each has length 1 through 3 and value 0 through 255.",
      "A segment of length greater than 1 cannot start with zero.",
      "At most 81 segment-width choices exist; return answers in lexicographic string order.",
    ],
    interface: "Solution.solve(digits: string) returns string[].",
    inputSchema: {
      kind: "object",
      properties: { digits: { kind: "string", maxLength: 12, ascii: true } },
    },
    semanticConstraints: [
      { kind: "alphabet", field: "digits", alphabet: "digits" },
    ],
    outputSchema: {
      kind: "array",
      maxLength: 81,
      items: { kind: "string", maxLength: 15, ascii: true },
    },
    function: functionSpec,
    generatorModule: "content/authoring/backtracking-addresses.mjs",
    generate: () =>
      fixtures.map(([digits, category]) => ({ input: { digits }, category })),
    oracle: addresses,
    independent: cutOracle,
    visible: [
      {
        input: { digits: "25525511135" },
        expected: ["255.255.11.135", "255.255.111.35"],
        explanation:
          "Both choices for the final two segment widths satisfy the value limit.",
      },
      {
        input: { digits: "0000" },
        expected: ["0.0.0.0"],
        explanation:
          "Each zero is a single canonical segment; a multi-digit zero segment would be invalid.",
      },
      {
        input: { digits: "123" },
        expected: [],
        explanation: "Three digits cannot fill four nonempty segments.",
      },
    ],
    mutations: {
      "allow-leading-zero-octets": (i) => addresses(i, true),
      "allow-octets-above-255": (i) => addresses(i, false, true),
      "reverse-answer-order": (i) => addresses(i).reverse(),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {String digits;ArrayList<String> out;ArrayList<String> path;void visit(int at){if(path.size()==4){if(at==digits.length())out.add(String.join(\".\",path));return;}int slots=4-path.size(),remaining=digits.length()-at;if(remaining<slots||remaining>3*slots)return;for(int width=1;width<=3&&at+width<=digits.length();width++){String part=digits.substring(at,at+width);if(width>1&&part.charAt(0)=='0')break;if(Integer.parseInt(part)>255)continue;path.add(part);visit(at+width);path.remove(path.size()-1);}}public String[] solve(String digits){this.digits=digits;out=new ArrayList<>();path=new ArrayList<>();visit(0);Collections.sort(out);return out.toArray(new String[0]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          'class Solution {public:vector<string> solve(string digits){vector<string> out,path;function<void(int)> visit=[&](int at){if(path.size()==4){if(at==(int)digits.size())out.push_back(path[0]+"."+path[1]+"."+path[2]+"."+path[3]);return;}int slots=4-(int)path.size(),remaining=(int)digits.size()-at;if(remaining<slots||remaining>3*slots)return;for(int width=1;width<=3&&at+width<=(int)digits.size();width++){string part=digits.substr(at,width);if(width>1&&part[0]==\'0\')break;if(stoi(part)>255)continue;path.push_back(part);visit(at+width);path.pop_back();}};visit(0);sort(out.begin(),out.end());return out;}};',
      },
      python: {
        starter: starters.python,
        reference:
          'class Solution:\n    def solve(self, digits):\n        out=[]\n        path=[]\n        def visit(at):\n            if len(path)==4:\n                if at==len(digits):\n                    out.append(".".join(path))\n                return\n            slots=4-len(path)\n            remaining=len(digits)-at\n            if remaining<slots or remaining>3*slots:\n                return\n            for width in range(1,4):\n                if at+width>len(digits):\n                    break\n                part=digits[at:at+width]\n                if width>1 and part[0]=="0":\n                    break\n                if int(part)>255:\n                    continue\n                path.append(part)\n                visit(at+width)\n                path.pop()\n        visit(0)\n        return sorted(out)\n',
      },
    },
  },
];
export function audit() {
  const d = definitions[0],
    seen = new Set(),
    visible = new Set(d.visible.map((c) => JSON.stringify(c.input))),
    failures = [],
    hidden = d.generate();
  let outputBytes = 0,
    feasible = 0;
  for (const c of [...hidden, ...d.visible]) {
    const key = JSON.stringify(c.input);
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input)
    )
      failures.push("invalid input " + key);
    if (hidden.includes(c)) {
      if (seen.has(key) || visible.has(key))
        failures.push("non-distinct hidden " + key);
      seen.add(key);
    }
    const expected = d.oracle(c.input);
    if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
      failures.push("oracle mismatch " + key);
    if (c.expected && JSON.stringify(c.expected) !== JSON.stringify(expected))
      failures.push("visible mismatch " + key);
    if (!validateInput(d.outputSchema, expected))
      failures.push("invalid output " + key);
    outputBytes += Buffer.byteLength(JSON.stringify(expected) + "\n");
    if (expected.length) feasible++;
  }
  if (hidden.length !== 60) failures.push("exact60 requirement");
  const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(d.oracle(c.input)),
    ),
  }));
  for (const m of mutations)
    if (!m.detected) failures.push("undetected " + m.name);
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted authored models only; native reference execution not performed",
    id: d.id,
    hidden: hidden.length,
    visible: 3,
    feasible,
    outputBytes,
    conservativeStdoutBytes: outputBytes + 512 * 63,
    conservativeEnvelopeBytes: 2 * (outputBytes + 512 * 63) + 65536,
    mutations,
    failures,
    sourceHash: createHash("sha256")
      .update(JSON.stringify(d.languages))
      .digest("hex"),
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-addresses-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-addresses-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-addresses.mjs")) audit();
