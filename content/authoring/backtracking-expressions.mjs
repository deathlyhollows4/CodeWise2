import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function expressions(
  { digits, target },
  leftToRight = false,
  leadingZeros = false,
) {
  if (!digits.length) return [];
  const out = [];
  function visit(at, text, total, last) {
    if (at === digits.length) {
      if (total === target) out.push(text);
      return;
    }
    for (let end = at + 1; end <= digits.length; end++) {
      if (!leadingZeros && end > at + 1 && digits[at] === "0") break;
      const word = digits.slice(at, end),
        value = Number(word);
      if (at === 0) visit(end, word, value, value);
      else {
        visit(end, text + "+" + word, total + value, value);
        visit(end, text + "-" + word, total - value, -value);
        visit(
          end,
          text + "*" + word,
          leftToRight ? total * value : total - last + last * value,
          leftToRight ? total * value : last * value,
        );
      }
    }
  }
  visit(0, "", 0, 0);
  return out.sort();
}
function enumerateAndEvaluate({ digits, target }) {
  if (!digits.length) return [];
  const out = [];
  for (let mask = 0; mask < 2 ** (digits.length - 1); mask++) {
    const words = [];
    let start = 0;
    for (let i = 0; i < digits.length - 1; i++)
      if (mask & (1 << i)) {
        words.push(digits.slice(start, i + 1));
        start = i + 1;
      }
    words.push(digits.slice(start));
    if (words.some((w) => w.length > 1 && w[0] === "0")) continue;
    for (let code = 0; code < 3 ** (words.length - 1); code++) {
      let rest = code;
      const ops = [];
      for (let i = 0; i < words.length - 1; i++) {
        ops.push(["+", "-", "*"][rest % 3]);
        rest = Math.floor(rest / 3);
      }
      let sum = 0,
        term = Number(words[0]),
        text = words[0];
      for (let i = 0; i < ops.length; i++) {
        const value = Number(words[i + 1]),
          op = ops[i];
        text += op + words[i + 1];
        if (op === "*") term *= value;
        else {
          sum += term;
          term = op === "+" ? value : -value;
        }
      }
      if (sum + term === target) out.push(text);
    }
  }
  return out.sort();
}
const visible = [
  {
    input: { digits: "123", target: 6 },
    expected: ["1*2*3", "1+2+3"],
    explanation:
      "Multiplication binds more tightly than addition, and both expressions use every digit in order.",
  },
  {
    input: { digits: "105", target: 5 },
    expected: ["1*0+5", "10-5"],
    explanation:
      "The operand 10 is allowed, but a multi-digit operand 05 would be invalid.",
  },
  {
    input: { digits: "", target: 0 },
    expected: [],
    explanation: "An empty input cannot form a nonempty arithmetic expression.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(digits, target, category) {
    const input = { digits, target },
      key = JSON.stringify(input);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ input, category });
  }
  for (const [digits, target] of [
    ["0", 0],
    ["0", 1],
    ["1", 1],
    ["9", -9],
    ["00", 0],
    ["000", 0],
    ["000000000", 0],
    ["000000000", 4294967296],
    ["999999999", 999999999],
    ["999999999", -999999999],
    ["100000000", 100000000],
    ["100000000", 0],
    ["214748364", 214748364],
    ["987654321", -1000000000000],
    ["987654321", 1000000000000],
    ["105", -5],
    ["232", 8],
    ["123", 7],
    ["123", -5],
    ["111111111", 0],
    ["101010101", 1],
    ["100000001", 1],
    ["100000001", 0],
    ["123456789", 45],
    ["999999999", 81],
    ["000000001", 1],
    ["012345678", 36],
    ["909090909", 0],
    ["222222222", 18],
    ["123456789", 1000000000000],
    ["123456789", -1000000000000],
  ])
    add(
      digits,
      target,
      "empty-zero-leading-zero-precedence-wide-and-maximum-length",
    );
  const random = seeded(0xb708);
  let serial = 0;
  while (out.length < 60) {
    const length = 3 + (serial % 7);
    let digits = "";
    for (let i = 0; i < length; i++) digits += String((random() >>> 12) % 10);
    const sum = [...digits].reduce((t, c) => t + Number(c), 0),
      target =
        serial % 3 === 0
          ? sum
          : serial % 3 === 1
            ? Number(digits[0]) -
              [...digits.slice(1)].reduce((t, c) => t + Number(c), 0)
            : 1000000000 + serial;
    add(
      digits,
      target,
      [
        "all-single-digit-addition-witness",
        "negative-term-witness",
        "impossible-above-concatenation",
      ][serial % 3],
    );
    serial++;
  }
  return out;
}
const fn = {
    arguments: [
      { name: "digits", type: "string" },
      { name: "target", type: "long" },
    ],
    returnType: "string[]",
  },
  starters = buildFunctionStarters(fn);
export const definitions = [
  {
    id: "backtracking-08",
    slug: "insert-arithmetic-operators-with-precedence",
    title: "Insert operators without changing the digits",
    primaryTopic: "backtracking",
    step: 4,
    skillIds: [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
      "backtracking.operand-boundaries",
      "backtracking.precedence-state",
    ],
    prerequisites: [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
    ],
    remedialIds: ["backtracking-01", "backtracking-02"],
    checkpointIds: ["backtracking-07"],
    nextIds: ["backtracking-09", "backtracking-10"],
    objective:
      "Enumerate operand boundaries and operators while maintaining multiplication precedence and canonical decimal literals.",
    rationale:
      "Search chooses both operand lengths and operations. Remembering the signed last multiplicative term avoids reparsing prefixes or evaluating operators left to right.",
    statement:
      '## Choose operand boundaries and operators\n\nUse every input digit exactly once, in its original order, to build a nonempty expression. Between adjacent digits, either concatenate them into one decimal operand or insert one of `+`, `-`, and `*`. Operands are nonnegative canonical decimal integers: "0" is allowed, but "00" and "05" are not. No unary signs, parentheses, division, or extra characters are allowed.\n\nReturn every expression whose value equals `target`, sorted lexicographically as strings. Multiplication has its usual precedence over addition and subtraction; for example, `1+2*3` equals 7. Distinct expression strings remain distinct answers. An empty digit string has no expression, even for target zero.\n\n### Native interface\n\n`solve(digits, target)` receives a native digit string and a wide signed target, returning a string array. Calculate safely with wide integers. This is an expression search task; you do not receive prewritten expressions to evaluate, and you must not use an external evaluator.',
    constraints: [
      "0 ≤ digits.length ≤ 9.",
      "Every input character is an ASCII decimal digit.",
      "−1,000,000,000,000 ≤ target ≤ 1,000,000,000,000.",
      "An operand with more than one digit cannot start with zero.",
      "There are at most 4^8 = 65,536 boundary/operator choices; each expression has at most 17 characters.",
      "All intermediate arithmetic fits signed 64-bit and exact JavaScript integer bounds under these digit limits.",
    ],
    interface:
      "Solution.solve(digits:string,target:long / long long) returns ordered string[].",
    inputSchema: {
      kind: "object",
      properties: {
        digits: { kind: "string", maxLength: 9, ascii: true },
        target: {
          kind: "integer",
          minimum: -1000000000000,
          maximum: 1000000000000,
        },
      },
    },
    semanticConstraints: [
      { kind: "alphabet", field: "digits", alphabet: "digits" },
    ],
    outputSchema: {
      kind: "array",
      maxLength: 65536,
      items: { kind: "string", maxLength: 17, ascii: true },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-expressions.mjs",
    generate: cases,
    oracle: expressions,
    independent: enumerateAndEvaluate,
    visible,
    mutations: {
      "evaluate-multiplication-left-to-right": (i) => expressions(i, true),
      "allow-leading-zero-operands": (i) => expressions(i, false, true),
      "truncate-target-to-32-bits": (i) =>
        expressions({ ...i, target: i.target | 0 }),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          'class Solution {String digits;long target;ArrayList<String> out;void visit(int at,String text,long total,long last){if(at==digits.length()){if(total==target)out.add(text);return;}for(int end=at+1;end<=digits.length();end++){if(end>at+1&&digits.charAt(at)==\'0\')break;String word=digits.substring(at,end);long value=Long.parseLong(word);if(at==0)visit(end,word,value,value);else{visit(end,text+"+"+word,total+value,value);visit(end,text+"-"+word,total-value,-value);visit(end,text+"*"+word,total-last+last*value,last*value);}}}public String[] solve(String digits,long target){if(digits.isEmpty())return new String[0];this.digits=digits;this.target=target;out=new ArrayList<>();visit(0,"",0,0);Collections.sort(out);return out.toArray(new String[0]);}}',
      },
      cpp: {
        starter: starters.cpp,
        reference:
          'class Solution {public:vector<string> solve(string digits,long long target){vector<string> out;if(digits.empty())return out;function<void(int,string,long long,long long)> visit=[&](int at,string text,long long total,long long last){if(at==(int)digits.size()){if(total==target)out.push_back(text);return;}for(int end=at+1;end<=(int)digits.size();end++){if(end>at+1&&digits[at]==\'0\')break;string word=digits.substr(at,end-at);long long value=stoll(word);if(at==0)visit(end,word,value,value);else{visit(end,text+"+"+word,total+value,value);visit(end,text+"-"+word,total-value,-value);visit(end,text+"*"+word,total-last+last*value,last*value);}}};visit(0,"",0,0);sort(out.begin(),out.end());return out;}};',
      },
      python: {
        starter: starters.python,
        reference:
          'class Solution:\n    def solve(self, digits, target):\n        if not digits:\n            return []\n        out=[]\n        def visit(at,text,total,last):\n            if at==len(digits):\n                if total==target:\n                    out.append(text)\n                return\n            for end in range(at+1,len(digits)+1):\n                if end>at+1 and digits[at]=="0":\n                    break\n                word=digits[at:end]\n                value=int(word)\n                if at==0:\n                    visit(end,word,value,value)\n                else:\n                    visit(end,text+"+"+word,total+value,value)\n                    visit(end,text+"-"+word,total-value,-value)\n                    visit(end,text+"*"+word,total-last+last*value,last*value)\n        visit(0,"",0,0)\n        return sorted(out)\n',
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
      !validateSemantics(d.semanticConstraints, c.input)
    )
      failures.push("input rejection");
    if (hidden.includes(c)) {
      const key = JSON.stringify(c.input);
      if (seen.has(key)) failures.push("duplicate hidden");
      seen.add(key);
    }
    const out = d.oracle(c.input);
    if (JSON.stringify(out) !== JSON.stringify(d.independent(c.input)))
      failures.push("independent mismatch " + JSON.stringify(c.input));
    if (c.expected && JSON.stringify(out) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (!validateInput(d.outputSchema, out)) failures.push("output rejection");
    bytes += Buffer.byteLength(JSON.stringify(out) + "\n");
    if (out.length) feasible++;
    max = Math.max(max, out.length);
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
  const stdout = bytes + 512 * 63,
    envelope = 2 * stdout + 65536;
  if (stdout > 4 * 1024 * 1024 || envelope > 6 * 1024 * 1024)
    failures.push("aggregate output budget");
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted JS independent models/template sources only; native execution pending",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRetainedAnswers: max,
    outputBytes: bytes,
    maximumOutputJsonNodes: 65537,
    conservativeStdoutBytes: stdout,
    conservativeEnvelopeBytes: envelope,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-expressions-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-expressions-template-sources.json",
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
if (process.argv[1]?.endsWith("backtracking-expressions.mjs")) audit();
