import { materializePack, seeded } from "./pack-builder.mjs";
import { extraDefinitions } from "./stack-extra.mjs";
import { retainedMaxCases } from "./owned-max-cases.mjs";
const pairs = { "(": ")", "[": "]", "{": "}" };
function balanced({ text }) {
  const stack = [];
  for (const c of text) {
    if (pairs[c]) stack.push(pairs[c]);
    else if (stack.pop() !== c) return false;
  }
  return stack.length === 0;
}
function brackets() {
  const r = seeded(0x57ac),
    alphabet = "()[]{}",
    out = [];
  for (let i = 0; i < 850; i++) {
    const n = (r() >>> 16) % 25;
    let text = Array.from({ length: n }, () => alphabet[(r() >>> 16) % 6]).join(
      "",
    );
    if (i % 3 === 0) {
      text = "";
      const closing = [];
      for (let j = 0; j < 1 + ((r() >>> 16) % 12); j++) {
        const opening = "([{ "[(r() >>> 16) % 3];
        text += opening;
        closing.unshift(pairs[opening]);
      }
      text += closing.join("");
    }
    out.push({
      input: { text },
      category: i % 3 === 0 ? "valid-nested" : "mixed-bracket-order",
    });
  }
  out.push(
    { input: { text: "[(])" }, category: "crossed-types" },
    { input: { text: ")(" }, category: "early-underflow" },
    {
      input: { text: "(".repeat(1000) + ")".repeat(1000) },
      category: "deep-valid-nesting",
    },
  );
  return out;
}
export const definitions = [
  {
    id: "stack-01",
    slug: "match-nested-delimiters",
    title: "Match nested delimiters",
    primaryTopic: "stack",
    generatorModule: "content/authoring/stack.mjs",
    step: 1,
    skillIds: ["stack.last-open-first-close", "stack.underflow"],
    prerequisites: ["arrays.traversal"],
    objective:
      "Use last-in-first-out state to verify delimiter type and nesting order.",
    rationale:
      "A counter can count openings. A stack also remembers which type must close next.",
    checkpointIds: ["stack-02"],
    nextIds: ["stack-03"],
    statement:
      "The string `text` contains only `(`, `)`, `[`, `]`, `{`, and `}`. Return `true` if every opening symbol has a matching closing symbol of the same type, and symbols close in the reverse order in which they opened. Otherwise return `false`. The empty string is valid.\n\nAn opening inside another pair must close before that surrounding pair closes.",
    constraints: [
      "0 ≤ text.length ≤ 2,000",
      "Only the six listed ASCII symbols occur.",
    ],
    interface: "Solution.solve(text) returns a boolean.",
    inputSchema: {
      kind: "object",
      properties: { text: { kind: "string", ascii: true, maxLength: 2000 } },
    },
    outputSchema: { kind: "boolean" },
    valid: ({ text }) => /^[()[\]{}]*$/.test(text),
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "boolean",
    },
    visible: [
      {
        input: { text: "{[()]}" },
        expected: true,
        explanation:
          "Round brackets close first, then square brackets, then braces.",
      },
      {
        input: { text: "" },
        expected: true,
        explanation: "No symbol is left unmatched.",
      },
      {
        input: { text: "([)]" },
        expected: false,
        explanation:
          "The square bracket was opened last, so a round closing bracket cannot close next.",
      },
    ],
    generate: brackets,
    oracle: balanced,
    independent: ({ text }) => {
      let previous;
      do {
        previous = text;
        text = text.replace(/\(\)|\[\]|\{\}/g, "");
      } while (text !== previous);
      return text.length === 0;
    },
    mutations: {
      "count-only-ignore-types": ({ text }) => {
        let depth = 0;
        for (const c of text) {
          depth += pairs[c] ? 1 : -1;
          if (depth < 0) return false;
        }
        return depth === 0;
      },
      "ignore-underflow": ({ text }) =>
        [...text].reduce((n, c) => n + (pairs[c] ? 1 : -1), 0) === 0,
    },
    languages: {
      java: {
        starter:
          "class Solution {public boolean solve(String text){return false;}}",
        reference:
          "class Solution {public boolean solve(String text){char[] stack=new char[text.length()];int size=0;for(char c:text.toCharArray()){if(c=='(')stack[size++]=')';else if(c=='[')stack[size++]=']';else if(c=='{')stack[size++]='}';else{if(size==0||stack[--size]!=c)return false;}}return size==0;}}",
      },
      cpp: {
        starter:
          "class Solution {public:bool solve(string text){return false;}};",
        reference:
          "class Solution {public:bool solve(string text){vector<char> expected;for(char c:text){if(c=='(')expected.push_back(')');else if(c=='[')expected.push_back(']');else if(c=='{')expected.push_back('}');else{if(expected.empty()||expected.back()!=c)return false;expected.pop_back();}}return expected.empty();}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, text):\n        return False\n",
        reference:
          'class Solution:\n    def solve(self, text):\n        expected=[]\n        pairs={"(":")","[":"]","{":"}"}\n        for character in text:\n            if character in pairs:\n                expected.append(pairs[character])\n            elif not expected or expected.pop()!=character:\n                return False\n        return not expected\n',
      },
    },
  },
];
for (const def of definitions)
  def.semanticConstraints = [
    { kind: "alphabet", field: "text", alphabet: "brackets" },
  ];
definitions[0].checkpointIds = ["stack-02", "stack-03"];
definitions[0].nextIds = ["stack-07"];
definitions.push(...extraDefinitions);
const stackById = new Map(definitions.map((def) => [def.id, def]));
for (const id of ["stack-01", "stack-03", "stack-07", "stack-08", "stack-09"])
  stackById.get(id).remedialIds = ["stack-02", "stack-01"];
stackById.get("stack-10").remedialIds = ["stack-01"];
stackById.get("stack-11").remedialIds = ["stack-04"];

// Circular next-greater actually applies the same candidate-dominance stack as04.
if (!stackById.get("stack-05").skillIds.includes("stack.monotonic-candidates"))
  stackById.get("stack-05").skillIds.push("stack.monotonic-candidates");
// Nested decoder preparation uses the actual weighted nested-aggregation teacher.
stackById.get("stack-12").remedialIds = ["stack-10"];

for (const def of definitions) {
  const prior = def.generate;
  def.generate = () => [...prior(), ...retainedMaxCases(def.id)];
}
if (process.argv[1]?.endsWith("stack.mjs"))
  for (const def of definitions) console.log(await materializePack(def));
