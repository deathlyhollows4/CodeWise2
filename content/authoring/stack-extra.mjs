import { seeded } from "./pack-builder.mjs";
import {popSequenceDefinition} from './stack-pop-sequence.mjs';
const int = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const arr = { kind: "array", maxLength: 2000, items: int };
const nonnegative = {
  ...arr,
  items: { kind: "integer", minimum: 0, maximum: 1000000 },
};
const text = { kind: "string", ascii: true, maxLength: 2000 };
const types = {
  int: ["int", "int"],
  long: ["long", "long long"],
  boolean: ["boolean", "bool"],
  string: ["String", "string"],
  "int[]": ["int[]", "vector<int>"],
  "string[]": ["String[]", "vector<string>"],
};
function langs(arg, ret, j, c, p) {
  const args =
    typeof arg === "string"
      ? [{ name: arg, type: arg === "text" ? "string" : "int[]" }]
      : arg;
  const argument = (i) =>
    args.map((a) => `${types[a.type][i]} ${a.name}`).join(",");
  const zeros = {
    boolean: ["false", "false", "False"],
    string: ['""', '""', '""'],
    "int[]": ["new int[0]", "{}", "[]"],
    "string[]": ["new String[0]", "{}", "[]"],
  };
  const zero = zeros[ret] || ["0", "0", "0"];
  return {
    java: {
      starter: `class Solution {public ${types[ret][0]} solve(${argument(0)}){return ${zero[0]};}}`,
      reference: `class Solution {public ${types[ret][0]} solve(${argument(0)}){${j}}}`,
    },
    cpp: {
      starter: `class Solution {public:${types[ret][1]} solve(${argument(1)}){return ${zero[1]};}};`,
      reference: `class Solution {public:${types[ret][1]} solve(${argument(1)}){${c}}};`,
    },
    python: {
      starter: `class Solution:\n    def solve(self, ${args.map((a) => a.name).join(", ")}):\n        return ${zero[2]}\n`,
      reference: `class Solution:\n    def solve(self, ${args.map((a) => a.name).join(", ")}):\n${p
        .split("\n")
        .map((line) => "        " + line)
        .join("\n")}\n`,
    },
  };
}
function arrays(seed = 0x57a4) {
  const r = seeded(seed);
  return Array.from({ length: 740 }, () => ({
    input: {
      values: Array.from(
        { length: (r() >>> 16) % 29 },
        () => ((r() >>> 16) % 41) - 20,
      ),
    },
    category: "ordered-sign-and-equality-patterns",
  }));
}
function cancelText({ text }) {
  const out = [];
  for (const c of text) {
    if (out.at(-1) === c) out.pop();
    else out.push(c);
  }
  return out.join("");
}
function warmer({ values }) {
  const out = Array(values.length).fill(0),
    stack = [];
  for (let i = 0; i < values.length; i++) {
    while (stack.length && values[i] > values[stack.at(-1)]) {
      const old = stack.pop();
      out[old] = i - old;
    }
    stack.push(i);
  }
  return out;
}
function circular({ values }) {
  const out = Array(values.length).fill(-1),
    stack = [];
  for (let i = 0; i < 2 * values.length; i++) {
    const index = i % values.length;
    while (stack.length && values[index] > values[stack.at(-1)])
      out[stack.pop()] = values[index];
    if (i < values.length) stack.push(index);
  }
  return out;
}
const common = {
  primaryTopic: "stack",
  generatorModule: "content/authoring/stack-extra.mjs",
  checker: { kind: "exact" },
};
export const extraDefinitions = [
  {
    ...common,
    id: "stack-02",
    slug: "undo-reading-stack",
    title: "Track undoable readings",
    step: 1,
    skillIds: ["stack.push-pop-history"],
    prerequisites: ["arrays.traversal"],
    checkpointIds: ["stack-03"],
    nextIds: ["stack-07"],
    objective:
      "Apply push and undo commands and report the current top after every event.",
    rationale:
      "A stack remembers the most recent reading that has not been undone.",
    statement:
      "Process integers in `commands` from left to right. A value of -1 means undo the most recent stored reading, if any. Any nonnegative value means store that reading on top. After each command, report the top stored reading, or -1 if the stack is empty. Undoing an empty stack does nothing. Return the entire top history in command order.",
    constraints: [
      "0 ≤ commands.length ≤ 2,000",
      "Each command is -1 or an integer in [0,1,000,000].",
    ],
    interface: "Solution.solve(commands) returns an integer history array.",
    inputSchema: {
      kind: "object",
      properties: {
        commands: {
          ...arr,
          items: { kind: "integer", minimum: -1, maximum: 1000000 },
        },
      },
    },
    outputSchema: {
      ...arr,
      items: { kind: "integer", minimum: -1, maximum: 1000000 },
    },
    function: {
      arguments: [{ name: "commands", type: "int[]" }],
      returnType: "int[]",
    },
    visible: [
      {
        input: { commands: [3, 5, -1, 2] },
        expected: [3, 5, 3, 2],
        explanation: "Undo removes 5 and reveals the previous 3.",
      },
      {
        input: { commands: [] },
        expected: [],
        explanation: "No commands means no history.",
      },
      {
        input: { commands: [-1, 0, -1, -1] },
        expected: [-1, 0, -1, -1],
        explanation:
          "Empty undos are harmless, and zero is a real stored reading.",
      },
    ],
    generate: () => {
      const r = seeded(0x57a2);
      return Array.from({ length: 730 }, () => ({
        input: {
          commands: Array.from({ length: (r() >>> 16) % 30 }, () =>
            (r() >>> 16) % 4 === 0 ? -1 : (r() >>> 16) % 31,
          ),
        },
        category: "push-and-underflow-events",
      }));
    },
    oracle: ({ commands }) => {
      const stack = [],
        out = [];
      for (const c of commands) {
        if (c === -1) stack.pop();
        else stack.push(c);
        out.push(stack.length ? stack.at(-1) : -1);
      }
      return out;
    },
    independent: ({ commands }) => {
      const stored = [],
        out = [];
      for (const c of commands) {
        if (c >= 0) stored.unshift(c);
        else if (stored.length) stored.splice(0, 1);
        out.push(stored.length ? stored[0] : -1);
      }
      return out;
    },
    mutations: {
      "undo-oldest-first": ({ commands }) => {
        const stack = [],
          out = [];
        for (const c of commands) {
          if (c === -1) stack.shift();
          else stack.push(c);
          out.push(stack.length ? stack.at(-1) : -1);
        }
        return out;
      },
      "ignore-zero-push": ({ commands }) => {
        const stack = [],
          out = [];
        for (const c of commands) {
          if (c === -1) stack.pop();
          else if (c > 0) stack.push(c);
          out.push(stack.length ? stack.at(-1) : -1);
        }
        return out;
      },
    },
    languages: langs(
      [{ name: "commands", type: "int[]" }],
      "int[]",
      `ArrayDeque<Integer> stack=new ArrayDeque<>();int[] out=new int[commands.length];for(int i=0;i<commands.length;i++){if(commands[i]==-1){if(!stack.isEmpty())stack.removeLast();}else stack.addLast(commands[i]);out[i]=stack.isEmpty()?-1:stack.peekLast();}return out;`,
      `vector<int> stack,out;for(int c:commands){if(c==-1){if(!stack.empty())stack.pop_back();}else stack.push_back(c);out.push_back(stack.empty()?-1:stack.back());}return out;`,
      `stack=[]\nout=[]\nfor command in commands:\n    if command==-1:\n        if stack:\n            stack.pop()\n    else:\n        stack.append(command)\n    out.append(stack[-1] if stack else -1)\nreturn out`,
    ),
  },
  {
    ...common,
    id: "stack-03",
    slug: "cancel-adjacent-letter-pairs",
    title: "Cancel adjacent letter pairs",
    step: 1,
    skillIds: ["stack.cascading-cancellation"],
    prerequisites: ["arrays.traversal"],
    checkpointIds: ["stack-02"],
    nextIds: ["stack-07"],
    objective:
      "Keep unresolved letters and allow removals to expose another matching pair.",
    rationale:
      "Removing the top can create a new match with the next arriving letter.",
    statement:
      "Repeatedly remove an adjacent pair of identical ASCII letters until no such pair remains. Return the remaining text. Pairs are removed as the text is processed from left to right, and cancellations can expose new pairs. Letter case matters. Empty text stays empty.",
    constraints: [
      "0 ≤ text.length ≤ 2,000",
      "Only ASCII letters a..z and A..Z occur.",
    ],
    interface: "Solution.solve(text) returns a string.",
    inputSchema: { kind: "object", properties: { text } },
    outputSchema: text,
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "string",
    },
    semanticConstraints: [
      { kind: "alphabet", field: "text", alphabet: "letters" },
    ],
    valid: ({ text }) => /^[A-Za-z]*$/.test(text),
    visible: [
      {
        input: { text: "aabcc" },
        expected: "b",
        explanation: "The aa and cc pairs disappear, leaving b.",
      },
      { input: { text: "" }, expected: "", explanation: "There is no pair." },
      {
        input: { text: "abbac" },
        expected: "c",
        explanation: "Removing bb exposes aa, so both pairs cancel.",
      },
    ],
    generate: () => {
      const r = seeded(0x57a3);
      const out = Array.from({ length: 750 }, () => ({
        input: {
          text: Array.from({ length: (r() >>> 16) % 31 }, () =>
            String.fromCharCode(97 + ((r() >>> 16) % 5)),
          ).join(""),
        },
        category: "cascading-letter-pairs",
      }));
      out.push({
        input: { text: "aAa" },
        category: "case-sensitive-noncancellation",
      });
      return out;
    },
    oracle: cancelText,
    independent: ({ text }) => {
      let previous;
      do {
        previous = text;
        text = text.replace(/(.)\1/g, "");
      } while (text !== previous);
      return text;
    },
    mutations: {
      "single-cancellation-pass": ({ text }) => text.replace(/(.)\1/g, ""),
      "case-insensitive-cancellation": ({ text }) =>
        cancelText({ text: text.toLowerCase() }),
    },
    languages: langs(
      "text",
      "string",
      `StringBuilder out=new StringBuilder();for(char c:text.toCharArray()){if(out.length()>0&&out.charAt(out.length()-1)==c)out.setLength(out.length()-1);else out.append(c);}return out.toString();`,
      `string out;for(char c:text){if(!out.empty()&&out.back()==c)out.pop_back();else out.push_back(c);}return out;`,
      `out=[]\nfor character in text:\n    if out and out[-1]==character:\n        out.pop()\n    else:\n        out.append(character)\nreturn "".join(out)`,
    ),
  },
  {
    ...common,
    id: "stack-04",
    slug: "wait-for-a-warmer-reading",
    title: "Wait for a warmer reading",
    step: 3,
    skillIds: ["stack.monotonic-candidates"],
    prerequisites: ["stack.push-pop-history"],
    checkpointIds: ["stack-05"],
    remedialIds: ["stack-02"],
    nextIds: ["stack-06"],
    objective:
      "Resolve earlier pending positions when a strictly larger reading appears.",
    rationale: "The stack stores unanswered positions, not just values.",
    statement:
      "For each entry in `values`, return how many positions forward you must move to reach the first strictly greater value. Return zero for an entry with no later greater value. Equal readings do not qualify, and searching does not wrap around the end.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each reading is in [-1,000,000,1,000,000].",
    ],
    interface: "Solution.solve(values) returns an integer wait array.",
    inputSchema: { kind: "object", properties: { values: arr } },
    outputSchema: {
      ...arr,
      items: { kind: "integer", minimum: 0, maximum: 1999 },
    },
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "int[]",
    },
    visible: [
      {
        input: { values: [5, 4, 6, 6] },
        expected: [2, 1, 0, 0],
        explanation: "The first 6 resolves 5 and 4; equal 6 is not warmer.",
      },
      {
        input: { values: [] },
        expected: [],
        explanation: "No readings need answers.",
      },
      {
        input: { values: [2, 2, 3] },
        expected: [2, 1, 0],
        explanation: "Equal readings wait until the 3.",
      },
    ],
    generate: () => arrays(0x57a4),
    oracle: warmer,
    independent: ({ values }) =>
      values.map((v, i) => {
        for (let j = i + 1; j < values.length; j++)
          if (values[j] > v) return j - i;
        return 0;
      }),
    mutations: {
      "accept-equal-reading": ({ values }) =>
        values.map((v, i) => {
          for (let j = i + 1; j < values.length; j++)
            if (values[j] >= v) return j - i;
          return 0;
        }),
      "return-next-index": ({ values }) =>
        values.map((v, i) => {
          for (let j = i + 1; j < values.length; j++)
            if (values[j] > v) return j;
          return 0;
        }),
    },
    languages: langs(
      "values",
      "int[]",
      `int[] out=new int[values.length];ArrayDeque<Integer> stack=new ArrayDeque<>();for(int i=0;i<values.length;i++){while(!stack.isEmpty()&&values[i]>values[stack.peekLast()]){int old=stack.removeLast();out[old]=i-old;}stack.addLast(i);}return out;`,
      `vector<int> out(values.size(),0),stack;for(int i=0;i<(int)values.size();i++){while(!stack.empty()&&values[i]>values[stack.back()]){int old=stack.back();stack.pop_back();out[old]=i-old;}stack.push_back(i);}return out;`,
      `out=[0]*len(values)\nstack=[]\nfor i,value in enumerate(values):\n    while stack and value>values[stack[-1]]:\n        old=stack.pop();out[old]=i-old\n    stack.append(i)\nreturn out`,
    ),
  },
  {
    ...common,
    id: "stack-05",
    slug: "next-greater-around-a-ring",
    title: "Next greater reading around a ring",
    step: 3,
    skillIds: ["stack.circular-scan"],
    prerequisites: ["stack.monotonic-candidates"],
    checkpointIds: ["stack-04"],
    nextIds: ["stack-06"],
    objective:
      "Reuse a monotonic candidate stack during a bounded second traversal.",
    rationale:
      "A second pass completes answers near the end without treating the ring as an endless search.",
    statement:
      "For each reading, search the following positions around a circular array for the first strictly greater value. Examine at most the other values.length - 1 positions. Return that greater value, or -1 if none exists. Equal values do not qualify. Return answers in original input order.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each value is in [-1,000,000,1,000,000].",
      "Empty input returns an empty answer array.",
    ],
    interface: "Solution.solve(values) returns the next-greater value array.",
    inputSchema: { kind: "object", properties: { values: arr } },
    outputSchema: arr,
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "int[]",
    },
    visible: [
      {
        input: { values: [2, 1, 3] },
        expected: [3, 3, -1],
        explanation: "The maximum 3 has no strictly larger reading anywhere.",
      },
      {
        input: { values: [] },
        expected: [],
        explanation: "There are no positions.",
      },
      {
        input: { values: [4, 4] },
        expected: [-1, -1],
        explanation: "Neither equal reading is strictly greater.",
      },
    ],
    generate: () => arrays(0x57a5),
    oracle: circular,
    independent: ({ values }) =>
      values.map((v, i) => {
        for (let step = 1; step < values.length; step++) {
          const x = values[(i + step) % values.length];
          if (x > v) return x;
        }
        return -1;
      }),
    mutations: {
      "never-wrap": ({ values }) =>
        values.map((v, i) => {
          for (let j = i + 1; j < values.length; j++)
            if (values[j] > v) return values[j];
          return -1;
        }),
      "accept-equality-around-ring": ({ values }) =>
        values.map((v, i) => {
          for (let step = 1; step < values.length; step++) {
            const x = values[(i + step) % values.length];
            if (x >= v) return x;
          }
          return -1;
        }),
    },
    languages: langs(
      "values",
      "int[]",
      `int n=values.length;int[] out=new int[n];Arrays.fill(out,-1);ArrayDeque<Integer> stack=new ArrayDeque<>();for(int i=0;i<2*n;i++){int index=i%n;while(!stack.isEmpty()&&values[index]>values[stack.peekLast()])out[stack.removeLast()]=values[index];if(i<n)stack.addLast(index);}return out;`,
      `int n=values.size();vector<int> out(n,-1),stack;for(int i=0;i<2*n;i++){int index=i%n;while(!stack.empty()&&values[index]>values[stack.back()]){out[stack.back()]=values[index];stack.pop_back();}if(i<n)stack.push_back(index);}return out;`,
      `n=len(values)\nout=[-1]*n\nstack=[]\nfor i in range(2*n):\n    index=i%n\n    while stack and values[index]>values[stack[-1]]:\n        out[stack.pop()]=values[index]\n    if i<n:\n        stack.append(index)\nreturn out`,
    ),
  },
];
function histogram({ values }) {
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    let height = Infinity;
    for (let j = i; j < values.length; j++) {
      height = Math.min(height, values[j]);
      best = Math.max(best, height * (j - i + 1));
    }
  }
  return best;
}
function nonnegativeInputs(seed) {
  return arrays(seed).map((c) => ({
    input: { values: c.input.values.map(Math.abs) },
    category: "nonnegative-height-and-equality-runs",
  }));
}
function postfixInputs() {
  const r = seeded(0x57a7);
  const tree = (depth) => {
    if (!depth || (r() >>> 16) % 4 === 0)
      return { tokens: [String(((r() >>> 16) % 19) - 9)] };
    const left = tree(depth - 1),
      right = tree(depth - 1),
      op = ["+", "-", "*"][(r() >>> 16) % 3];
    return { tokens: [...left.tokens, ...right.tokens, op] };
  };
  return Array.from({ length: 750 }, () => ({
    input: tree(3),
    category: "generated-bounded-expression-tree",
  }));
}
function postfix({ tokens }, swap = false) {
  const stack = [];
  for (const token of tokens) {
    if (["+", "-", "*"].includes(token)) {
      let b = stack.pop(),
        a = stack.pop();
      if (swap) [a, b] = [b, a];
      stack.push(token === "+" ? a + b : token === "-" ? a - b : a * b);
    } else stack.push(Number(token));
  }
  return stack[0];
}
function smaller({ values }) {
  const out = [],
    stack = [];
  for (let i = 0; i < values.length; i++) {
    while (stack.length && values[stack.at(-1)] >= values[i]) stack.pop();
    out.push(stack.length ? stack.at(-1) : -1);
    stack.push(i);
  }
  return out;
}
function collide({ values }) {
  const out = [];
  for (const value of values) {
    if (value === 0) continue;
    let alive = true;
    while (alive && value < 0 && out.length && out.at(-1) > 0) {
      const old = out.at(-1);
      if (old < -value) out.pop();
      else if (old === -value) {
        out.pop();
        alive = false;
      } else alive = false;
    }
    if (alive) out.push(value);
  }
  return out;
}
function minima({ values }) {
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    let low = Infinity;
    for (let j = i; j < values.length; j++) {
      low = Math.min(low, values[j]);
      total += low;
    }
  }
  return total;
}
extraDefinitions.push(
  {
    ...common,
    id: "stack-06",
    slug: "largest-histogram-rectangle",
    title: "Largest rectangle under readings",
    step: 4,
    skillIds: ["stack.rectangle-boundaries"],
    prerequisites: ["stack.monotonic-candidates"],
    checkpointIds: ["stack-11"],
    remedialIds: ["stack-04"],
    objective:
      "Identify how far each bar height can extend before a shorter boundary stops it.",
    rationale:
      "A popped monotonic candidate now contributes an entire rectangle.",
    statement:
      "The nonnegative entries of `values` describe adjacent bars, each of width one. Return the greatest area of a rectangle that lies under these bars and spans consecutive positions. Its height cannot exceed the shortest selected bar. Empty input returns zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "0 ≤ each bar height ≤ 1,000,000.",
      "Return a 64-bit integer area.",
    ],
    interface: "Solution.solve(values) returns a 64-bit area.",
    inputSchema: { kind: "object", properties: { values: nonnegative } },
    outputSchema: { kind: "safe-integer" },
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "long",
    },
    visible: [
      {
        input: { values: [2, 1, 3, 3] },
        expected: 6,
        explanation: "The final two bars permit height 3 and width 2.",
      },
      { input: { values: [] }, expected: 0, explanation: "There are no bars." },
      {
        input: { values: [4, 4] },
        expected: 8,
        explanation: "Equal-height bars can share one wider rectangle.",
      },
    ],
    generate: () => nonnegativeInputs(0x57a6),
    oracle: histogram,
    independent: ({ values }) => {
      let best = 0;
      for (const height of new Set(values)) {
        let run = 0;
        for (const value of values) {
          run = value >= height ? run + 1 : 0;
          best = Math.max(best, run * height);
        }
      }
      return best;
    },
    mutations: {
      "ignore-shorter-interior-bars": ({ values }) =>
        values.length ? Math.max(...values) * values.length : 0,
      "single-bar-only": ({ values }) =>
        values.length ? Math.max(...values) : 0,
    },
    languages: langs(
      "values",
      "long",
      `ArrayDeque<Integer> stack=new ArrayDeque<>();long best=0;for(int i=0;i<=values.length;i++){int height=i==values.length?0:values[i];while(!stack.isEmpty()&&values[stack.peekLast()]>height){int h=values[stack.removeLast()],left=stack.isEmpty()?-1:stack.peekLast();best=Math.max(best,(long)h*(i-left-1));}stack.addLast(i);}return best;`,
      `vector<int> stack;long long best=0;for(int i=0;i<=(int)values.size();i++){int height=i==(int)values.size()?0:values[i];while(!stack.empty()&&values[stack.back()]>height){int h=values[stack.back()];stack.pop_back();int left=stack.empty()?-1:stack.back();best=max(best,1LL*h*(i-left-1));}stack.push_back(i);}return best;`,
      `stack=[]\nbest=0\nfor i in range(len(values)+1):\n    height=values[i] if i<len(values) else 0\n    while stack and values[stack[-1]]>height:\n        h=values[stack.pop()]\n        left=stack[-1] if stack else -1\n        best=max(best,h*(i-left-1))\n    stack.append(i)\nreturn best`,
    ),
  },
  {
    ...common,
    id: "stack-07",
    slug: "evaluate-postfix-readings",
    title: "Evaluate a postfix calculation",
    step: 2,
    skillIds: ["stack.operand-order"],
    prerequisites: ["stack.push-pop-history"],
    checkpointIds: ["stack-10"],
    nextIds: ["stack-04"],
    objective:
      "Pop the right operand before the left operand when evaluating postfix arithmetic.",
    rationale:
      "The stack stores intermediate answers, and subtraction makes operand order visible.",
    statement:
      "Evaluate the valid postfix expression in `tokens`. An integer token pushes its value. An operator token (`+`, `-`, or `*`) consumes the last two values: the earlier value is the left operand, and the later value is the right operand. Push the result. Exactly one answer remains at the end. Inputs guarantee a valid expression and all intermediate results stay in [-1,000,000,000,1,000,000,000].",
    constraints: [
      "1 ≤ tokens.length ≤ 31",
      "Integer tokens are canonical decimal integers in [-100,100], with no leading plus or redundant leading zero.",
      "Operators are exactly +, -, or *.",
      "Every operator has two operands, and one final value remains.",
    ],
    interface: "Solution.solve(tokens) returns a 64-bit integer result.",
    inputSchema: {
      kind: "object",
      properties: {
        tokens: {
          kind: "array",
          minLength: 1,
          maxLength: 31,
          items: { kind: "string", ascii: true, minLength: 1, maxLength: 5 },
        },
      },
    },
    outputSchema: {
      kind: "integer",
      minimum: -1000000000,
      maximum: 1000000000,
    },
    function: {
      arguments: [{ name: "tokens", type: "string[]" }],
      returnType: "long",
    },
    semanticConstraints: [
      {
        kind: "postfix-bounded",
        field: "tokens",
        operations: ["+", "-", "*"],
        minLiteral: -100,
        maxLiteral: 100,
        maxAbs: 1000000000,
      },
    ],
    valid: ({ tokens }) => {
      let stack = [];
      for (const token of tokens) {
        if (["+", "-", "*"].includes(token)) {
          if (stack.length < 2) return false;
          const b = stack.pop(),
            a = stack.pop(),
            v = token === "+" ? a + b : token === "-" ? a - b : a * b;
          if (Math.abs(v) > 1000000000) return false;
          stack.push(v);
        } else {
          if (
            !/^-?(0|[1-9][0-9]*)$/.test(token) ||
            token === "-0" ||
            Number(token) < -100 ||
            Number(token) > 100
          )
            return false;
          stack.push(Number(token));
        }
      }
      return stack.length === 1;
    },
    visible: [
      {
        input: { tokens: ["2", "3", "+", "4", "*"] },
        expected: 20,
        explanation: "Add 2 and 3, then multiply the resulting 5 by 4.",
      },
      {
        input: { tokens: ["-5"] },
        expected: -5,
        explanation: "A single integer is already a complete expression.",
      },
      {
        input: { tokens: ["8", "3", "-", "2", "*"] },
        expected: 10,
        explanation: "The subtraction is 8 minus 3, not 3 minus 8.",
      },
    ],
    generate: postfixInputs,
    oracle: (input) => postfix(input),
    independent: ({ tokens }) => {
      let pos = tokens.length - 1;
      function consume() {
        const t = tokens[pos--];
        if (!["+", "-", "*"].includes(t)) return Number(t);
        const right = consume(),
          left = consume();
        return t === "+"
          ? left + right
          : t === "-"
            ? left - right
            : left * right;
      }
      return consume();
    },
    mutations: {
      "reverse-subtraction-operands": (input) => postfix(input, true),
      "sum-literal-tokens-only": ({ tokens }) =>
        tokens
          .filter((t) => !["+", "-", "*"].includes(t))
          .reduce((s, t) => s + Number(t), 0),
    },
    languages: langs(
      [{ name: "tokens", type: "string[]" }],
      "long",
      `ArrayDeque<Long> stack=new ArrayDeque<>();for(String token:tokens){if(token.equals("+")||token.equals("-")||token.equals("*")){long b=stack.removeLast(),a=stack.removeLast();stack.addLast(token.equals("+")?a+b:token.equals("-")?a-b:a*b);}else stack.addLast(Long.parseLong(token));}return stack.peekLast();`,
      `vector<long long> stack;for(string token:tokens){if(token=="+"||token=="-"||token=="*"){long long b=stack.back();stack.pop_back();long long a=stack.back();stack.pop_back();stack.push_back(token=="+"?a+b:token=="-"?a-b:a*b);}else stack.push_back(stoll(token));}return stack.back();`,
      `stack=[]\nfor token in tokens:\n    if token in ("+","-","*"):\n        right=stack.pop();left=stack.pop()\n        stack.append(left+right if token=="+" else left-right if token=="-" else left*right)\n    else:\n        stack.append(int(token))\nreturn stack[-1]`,
    ),
  },
  popSequenceDefinition,
  {
    ...common,
    id: "stack-09",
    slug: "resolve-opposing-motion",
    title: "Resolve opposing moving readings",
    step: 3,
    skillIds: ["stack.collision-resolution"],
    prerequisites: ["stack.push-pop-history"],
    checkpointIds: ["stack-12"],
    nextIds: ["stack-06"],
    objective:
      "Resolve a chain of collisions against the latest surviving right-moving object.",
    rationale:
      "One new object can remove several earlier candidates before it survives or disappears.",
    statement:
      "Nonzero values describe moving objects in left-to-right positional order. A positive value moves right; a negative value moves left. Its absolute value is its size. A right-moving object followed by a left-moving object collides: the smaller disappears, and equal sizes both disappear. Continue resolving collisions until none remain. A zero is an empty reading and is ignored. Return surviving nonzero values in their original positional order.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "-1,000,000 ≤ values[i] ≤ 1,000,000.",
      "All objects have the same speed.",
    ],
    interface: "Solution.solve(values) returns the survivor array.",
    inputSchema: { kind: "object", properties: { values: arr } },
    outputSchema: arr,
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "int[]",
    },
    visible: [
      {
        input: { values: [5, 2, -3] },
        expected: [5],
        explanation:
          "The left-moving size 3 removes size 2, then loses to size 5.",
      },
      { input: { values: [] }, expected: [], explanation: "No objects exist." },
      {
        input: { values: [4, -4, 0, -2] },
        expected: [-2],
        explanation:
          "Equal sizes vanish; zero is ignored; the final left-moving object remains.",
      },
    ],
    generate: () => arrays(0x57a9),
    oracle: collide,
    independent: ({ values }) => {
      const out = values.filter((v) => v !== 0);
      let found = true;
      while (found) {
        found = false;
        for (let i = 0; i + 1 < out.length; i++) {
          if (out[i] > 0 && out[i + 1] < 0) {
            const a = out[i],
              b = -out[i + 1];
            if (a === b) out.splice(i, 2);
            else if (a < b) out.splice(i, 1);
            else out.splice(i + 1, 1);
            found = true;
            break;
          }
        }
      }
      return out;
    },
    mutations: {
      "skip-all-collisions": ({ values }) => values.filter((v) => v !== 0),
      "one-collision-only": ({ values }) => {
        const out = [];
        for (const x of values) {
          if (!x) continue;
          if (x < 0 && out.at(-1) > 0) {
            const a = out.pop();
            if (a > -x) out.push(a);
            else if (a < -x) out.push(x);
          } else out.push(x);
        }
        return out;
      },
    },
    languages: langs(
      "values",
      "int[]",
      `ArrayList<Integer> out=new ArrayList<>();for(int value:values){if(value==0)continue;boolean alive=true;while(alive&&value<0&&!out.isEmpty()&&out.get(out.size()-1)>0){int old=out.get(out.size()-1);if(old<-value)out.remove(out.size()-1);else if(old==-value){out.remove(out.size()-1);alive=false;}else alive=false;}if(alive)out.add(value);}int[] result=new int[out.size()];for(int i=0;i<result.length;i++)result[i]=out.get(i);return result;`,
      `vector<int> out;for(int value:values){if(value==0)continue;bool alive=true;while(alive&&value<0&&!out.empty()&&out.back()>0){int old=out.back();if(old<-value)out.pop_back();else if(old==-value){out.pop_back();alive=false;}else alive=false;}if(alive)out.push_back(value);}return out;`,
      `out=[]\nfor value in values:\n    if value==0:\n        continue\n    alive=True\n    while alive and value<0 and out and out[-1]>0:\n        old=out[-1]\n        if old<-value:\n            out.pop()\n        elif old==-value:\n            out.pop();alive=False\n        else:\n            alive=False\n    if alive:\n        out.append(value)\nreturn out`,
    ),
  },
  {
    ...common,
    id: "stack-11",
    slug: "sum-of-batch-minima",
    title: "Add every batch minimum",
    step: 4,
    skillIds: ["stack.unique-minimum-contributions"],
    prerequisites: [
      "stack.monotonic-candidates",
    ],
    checkpointIds: ["stack-06"],
    objective:
      "Attribute each subarray minimum to one position using asymmetric handling of equal values.",
    rationale:
      "Boundary counts turn one reading into its contribution across many batches.",
    statement:
      "For every nonempty contiguous batch in nonnegative `values`, find its minimum. Return the sum of all those minima. Batches with different position boundaries count separately. Do not take a remainder or modulo; return the exact 64-bit total. Empty input returns zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "0 ≤ each value ≤ 1,000,000.",
      "The exact result is at most 2,001,000,000,000 and fits a signed 64-bit integer.",
    ],
    interface: "Solution.solve(values) returns a 64-bit sum.",
    inputSchema: { kind: "object", properties: { values: nonnegative } },
    outputSchema: { kind: "safe-integer" },
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "long",
    },
    visible: [
      {
        input: { values: [3, 1, 2] },
        expected: 9,
        explanation:
          "Singleton minima total 6; the other three batch minima are each 1.",
      },
      {
        input: { values: [] },
        expected: 0,
        explanation: "No nonempty batch exists.",
      },
      {
        input: { values: [2, 2] },
        expected: 6,
        explanation:
          "The two singleton batches and the length-two batch each contribute 2.",
      },
    ],
    generate: () =>
      nonnegativeInputs(0x57ab).concat([
        {
          input: { values: Array(2000).fill(1000000) },
          category: "wide-exact-total",
        },
      ]),
    oracle: minima,
    independent: ({ values }) => {
      let total = 0;
      for (let end = 0; end < values.length; end++) {
        let low = Infinity;
        for (let start = end; start >= 0; start--) {
          low = Math.min(low, values[start]);
          total += low;
        }
      }
      return total;
    },
    mutations: {
      "omit-singletons": (input) =>
        minima(input) - input.values.reduce((s, v) => s + v, 0),
      "32-bit-result": (input) => minima(input) | 0,
    },
    languages: langs(
      "values",
      "long",
      `int n=values.length;int[] left=new int[n],right=new int[n];ArrayDeque<Integer> stack=new ArrayDeque<>();for(int i=0;i<n;i++){while(!stack.isEmpty()&&values[stack.peekLast()]>=values[i])stack.removeLast();left[i]=i-(stack.isEmpty()?-1:stack.peekLast());stack.addLast(i);}stack.clear();for(int i=n-1;i>=0;i--){while(!stack.isEmpty()&&values[stack.peekLast()]>values[i])stack.removeLast();right[i]=(stack.isEmpty()?n:stack.peekLast())-i;stack.addLast(i);}long total=0;for(int i=0;i<n;i++)total+=(long)values[i]*left[i]*right[i];return total;`,
      `int n=values.size();vector<int> left(n),right(n),stack;for(int i=0;i<n;i++){while(!stack.empty()&&values[stack.back()]>=values[i])stack.pop_back();left[i]=i-(stack.empty()?-1:stack.back());stack.push_back(i);}stack.clear();for(int i=n-1;i>=0;i--){while(!stack.empty()&&values[stack.back()]>values[i])stack.pop_back();right[i]=(stack.empty()?n:stack.back())-i;stack.push_back(i);}long long total=0;for(int i=0;i<n;i++)total+=1LL*values[i]*left[i]*right[i];return total;`,
      `n=len(values)\nleft=[0]*n\nright=[0]*n\nstack=[]\nfor i,value in enumerate(values):\n    while stack and values[stack[-1]]>=value:\n        stack.pop()\n    left[i]=i-(stack[-1] if stack else -1)\n    stack.append(i)\nstack=[]\nfor i in range(n-1,-1,-1):\n    while stack and values[stack[-1]]>values[i]:\n        stack.pop()\n    right[i]=(stack[-1] if stack else n)-i\n    stack.append(i)\nreturn sum(values[i]*left[i]*right[i] for i in range(n))`,
    ),
  },
);
const closes = { "(": ")", "[": "]", "{": "}" },
  weights = { "(": 1, "[": 2, "{": 3 };
function nestedScore({ text }) {
  const stack = [];
  let total = 0;
  for (const c of text) {
    if (closes[c]) stack.push({ open: c, total: 0 });
    else {
      const frame = stack.pop();
      if (!frame || closes[frame.open] !== c) return -1;
      const score = frame.total === 0 ? weights[frame.open] : 2 * frame.total;
      if (stack.length) stack.at(-1).total += score;
      else total += score;
    }
  }
  return stack.length ? -1 : total;
}
function scoreInputs() {
  const r = seeded(0x57ac),
    alphabet = "()[]{}",
    out = [];
  for (let i = 0; i < 740; i++) {
    let text;
    if (i % 3 === 0) {
      const opening = Array.from(
        { length: 1 + ((r() >>> 16) % 19) },
        () => "([{"[(r() >>> 16) % 3],
      );
      text =
        opening.join("") +
        [...opening]
          .reverse()
          .map((c) => closes[c])
          .join("");
    } else
      text = Array.from(
        { length: (r() >>> 16) % 41 },
        () => alphabet[(r() >>> 16) % 6],
      ).join("");
    out.push({
      input: { text },
      category:
        i % 3 === 0
          ? "valid-weighted-nesting"
          : "invalid-or-mixed-bracket-score",
    });
  }
  return out;
}
function decode({ text }, ignoreRepeats = false) {
  const frames = [];
  let current = "",
    number = 0,
    pending = false;
  for (const c of text) {
    if (c >= "0" && c <= "9") {
      if (!pending && c === "0") return "INVALID";
      number = number * 10 + Number(c);
      pending = true;
      if (number > 10000) return "INVALID";
    } else if (c === "[") {
      if (!pending || number < 1) return "INVALID";
      frames.push({ prefix: current, count: number });
      current = "";
      number = 0;
      pending = false;
    } else if (c === "]") {
      if (pending || !frames.length) return "INVALID";
      const { prefix, count } = frames.pop();
      const repeat = ignoreRepeats ? 1 : count;
      if (prefix.length + current.length * repeat > 10000) return "INVALID";
      current = prefix + current.repeat(repeat);
    } else if (c >= "a" && c <= "z") {
      if (pending) return "INVALID";
      current += c;
      if (current.length > 10000) return "INVALID";
    } else return "INVALID";
  }
  return pending || frames.length ? "INVALID" : current;
}
function decodeInputs() {
  const r = seeded(0x57ad),
    letters = () =>
      Array.from({ length: (r() >>> 16) % 5 }, () =>
        String.fromCharCode(97 + ((r() >>> 16) % 5)),
      ).join("");
  function encoded(depth) {
    if (!depth || (r() >>> 16) % 3 === 0) return letters();
    return (
      letters() +
      (1 + ((r() >>> 16) % 5)) +
      "[" +
      encoded(depth - 1) +
      "]" +
      letters()
    );
  }
  const out = Array.from({ length: 800 }, (_, i) => ({
    input: { text: encoded(3) + (i % 7 === 0 ? "]" : "") },
    category: i % 7 === 0 ? "malformed-close" : "bounded-nested-repetition",
  }));
  for (const text of [
    "10000[a]",
    "10001[a]",
    "0[a]",
    "02[a]",
    "2[a",
    "[a]",
    "1[]",
    "a2b",
    "2[<]",
  ])
    out.push({ input: { text }, category: "grammar-and-expansion-boundary" });
  return out;
}
extraDefinitions.push(
  {
    ...common,
    id: "stack-10",
    slug: "score-nested-delimiters",
    title: "Score nested delimiters",
    step: 2,
    skillIds: ["stack.nested-aggregation"],
    prerequisites: ["stack.last-open-first-close"],
    checkpointIds: ["stack-07"],
    nextIds: ["stack-12"],
    objective:
      "Accumulate values inside stack frames while validating delimiter types.",
    rationale:
      "Each unfinished pair now remembers an inner score in addition to its closing type.",
    statement:
      "Score a correctly matched delimiter string using these rules: the empty string scores 0; an empty pair () scores 1, [] scores 2, and {} scores 3; a pair enclosing a nonempty valid string scores twice the enclosed score; adjacent valid strings have their scores added. Return -1 if delimiters are not correctly matched or nested. Enclosing type changes the empty-pair score only, not the doubling rule.",
    constraints: [
      "0 ≤ text.length ≤ 50",
      "Only (, ), [, ], {, and } occur.",
      "All valid scores fit within 1,000,000,000.",
    ],
    interface: "Solution.solve(text) returns the score or -1.",
    inputSchema: {
      kind: "object",
      properties: { text: { ...text, maxLength: 50 } },
    },
    outputSchema: { kind: "integer", minimum: -1, maximum: 1000000000 },
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "long",
    },
    semanticConstraints: [
      { kind: "alphabet", field: "text", alphabet: "brackets" },
    ],
    valid: ({ text }) => /^[()[\]{}]*$/.test(text),
    visible: [
      {
        input: { text: "([]){}" },
        expected: 7,
        explanation: "[] scores 2, so ([]) scores 4; the separate {} adds 3.",
      },
      {
        input: { text: "" },
        expected: 0,
        explanation: "No pair contributes a score.",
      },
      {
        input: { text: "([)]" },
        expected: -1,
        explanation:
          "A mismatched closing type makes the whole string invalid.",
      },
    ],
    generate: scoreInputs,
    oracle: nestedScore,
    independent: ({ text }) => {
      let position = 0;
      function sequence(end = null) {
        let score = 0;
        while (position < text.length) {
          const c = text[position++];
          if (")]}".includes(c)) {
            if (c !== end) throw new Error("mismatch");
            return score;
          }
          if (!closes[c]) throw new Error("invalid");
          const inside = sequence(closes[c]);
          score += inside === 0 ? weights[c] : 2 * inside;
        }
        if (end) throw new Error("unclosed");
        return score;
      }
      try {
        return sequence();
      } catch {
        return -1;
      }
    },
    mutations: {
      "erase-delimiter-types": ({ text }) =>
        nestedScore({
          text: text.replace(/[\[{]/g, "(").replace(/[\]}]/g, ")"),
        }),
      "count-empty-pairs-only": ({ text }) =>
        nestedScore({ text }) < 0
          ? -1
          : (text.match(/\(\)/g) || []).length +
            2 * (text.match(/\[\]/g) || []).length +
            3 * (text.match(/\{\}/g) || []).length,
    },
    languages: langs(
      "text",
      "long",
      `char[] open=new char[text.length()];long[] inside=new long[text.length()];int depth=0;long total=0;for(char c:text.toCharArray()){if(c=='('||c=='['||c=='{'){open[depth]=c;inside[depth++]=0;}else{if(depth==0)return -1;char o=open[depth-1],expected=o=='('?')':o=='['?']':'}';if(c!=expected)return -1;long child=inside[--depth],value=child==0?(o=='('?1:o=='['?2:3):2*child;if(depth>0)inside[depth-1]+=value;else total+=value;}}return depth==0?total:-1;`,
      `vector<pair<char,long long>> frames;long long total=0;for(char c:text){if(c=='('||c=='['||c=='{')frames.push_back({c,0});else{if(frames.empty())return -1;auto frame=frames.back();frames.pop_back();char expected=frame.first=='('?')':frame.first=='['?']':'}';if(c!=expected)return -1;long long value=frame.second==0?(frame.first=='('?1:frame.first=='['?2:3):2*frame.second;if(frames.empty())total+=value;else frames.back().second+=value;}}return frames.empty()?total:-1;`,
      `frames=[]\ncloses={"(":")","[":"]","{":"}"}\nweights={"(":1,"[":2,"{":3}\ntotal=0\nfor character in text:\n    if character in closes:\n        frames.append([character,0])\n    else:\n        if not frames:\n            return -1\n        opening,inside=frames.pop()\n        if closes[opening]!=character:\n            return -1\n        value=weights[opening] if inside==0 else 2*inside\n        if frames:\n            frames[-1][1]+=value\n        else:\n            total+=value\nreturn total if not frames else -1`,
    ),
  },
  {
    ...common,
    id: "stack-12",
    slug: "decode-bounded-repeated-blocks",
    title: "Decode bounded repeated blocks",
    step: 3,
    skillIds: ["stack.prefix-and-repeat-frames"],
    prerequisites: ["stack.nested-aggregation"],
    checkpointIds: ["stack-09"],
    nextIds: ["stack-06"],
    objective:
      "Remember the surrounding prefix and repeat count while decoding a nested block safely.",
    rationale:
      "A frame stores both the partial output and what to do when an inner block closes.",
    statement:
      "Decode lowercase letters and repeated blocks in `text`. A positive decimal count immediately followed by [block] repeats the decoded block that many times; blocks may nest. Counts have no leading zeros and are at most 10,000. Literal characters must be lowercase ASCII letters. Empty blocks and empty text are allowed. Return the uppercase word `INVALID` for malformed syntax or if any intermediate decoded part, including the final result, would exceed 10,000 characters. Never produce a partially decoded answer after an error.",
    constraints: [
      "0 ≤ encoded text.length ≤ 200",
      "Input is ASCII text; unsupported characters are malformed.",
      "Valid counts are 1..10,000 with no leading zero.",
      "The decoded output limit is 10,000 characters.",
    ],
    interface: "Solution.solve(text) returns decoded text or exactly INVALID.",
    inputSchema: {
      kind: "object",
      properties: { text: { ...text, maxLength: 200 } },
    },
    outputSchema: { kind: "string", ascii: true, maxLength: 10000 },
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "string",
    },
    visible: [
      {
        input: { text: "2[ab]c" },
        expected: "ababc",
        explanation: "Repeat ab twice, then append c.",
      },
      {
        input: { text: "" },
        expected: "",
        explanation: "Empty encoded text decodes to empty text.",
      },
      {
        input: { text: "2[a3[b]]" },
        expected: "abbbabbb",
        explanation:
          "Decode a3[b] as abbb, then repeat that entire block twice.",
      },
    ],
    generate: decodeInputs,
    oracle: (input) => decode(input),
    independent: ({ text }) => {
      let pos = 0;
      function block(nested = false) {
        let out = "";
        while (pos < text.length) {
          const c = text[pos];
          if (c === "]") {
            if (!nested) throw new Error("extra close");
            pos++;
            return out;
          }
          if (c >= "a" && c <= "z") {
            out += c;
            pos++;
          } else if (c >= "1" && c <= "9") {
            let count = 0;
            while (pos < text.length && text[pos] >= "0" && text[pos] <= "9") {
              count = count * 10 + Number(text[pos++]);
              if (count > 10000) throw new Error("count");
            }
            if (text[pos++] !== "[") throw new Error("open");
            const inside = block(true);
            if (out.length + inside.length * count > 10000)
              throw new Error("size");
            out += inside.repeat(count);
          } else throw new Error("syntax");
          if (out.length > 10000) throw new Error("size");
        }
        if (nested) throw new Error("unclosed");
        return out;
      }
      try {
        return block();
      } catch {
        return "INVALID";
      }
    },
    mutations: {
      "ignore-repeat-counts": (input) => decode(input, true),
      "strip-structural-text": ({ text }) =>
        decode({ text }) === "INVALID"
          ? "INVALID"
          : text.replace(/[0-9\[\]]/g, ""),
    },
    languages: langs(
      "text",
      "string",
      `ArrayList<String> prefixes=new ArrayList<>();ArrayList<Integer> counts=new ArrayList<>();String current="";int number=0;boolean pending=false;for(char c:text.toCharArray()){if(c>='0'&&c<='9'){if(!pending&&c=='0')return "INVALID";number=number*10+(c-'0');pending=true;if(number>10000)return "INVALID";}else if(c=='['){if(!pending||number<1)return "INVALID";prefixes.add(current);counts.add(number);current="";number=0;pending=false;}else if(c==']'){if(pending||counts.isEmpty())return "INVALID";int last=counts.size()-1,count=counts.remove(last);String prefix=prefixes.remove(last);if(prefix.length()+(long)current.length()*count>10000)return "INVALID";current=prefix+current.repeat(count);}else if(c>='a'&&c<='z'){if(pending)return "INVALID";current+=c;if(current.length()>10000)return "INVALID";}else return "INVALID";}return pending||!counts.isEmpty()?"INVALID":current;`,
      `vector<string> prefixes;vector<int> counts;string current;int number=0;bool pending=false;for(char c:text){if(c>='0'&&c<='9'){if(!pending&&c=='0')return "INVALID";number=number*10+(c-'0');pending=true;if(number>10000)return "INVALID";}else if(c=='['){if(!pending||number<1)return "INVALID";prefixes.push_back(current);counts.push_back(number);current="";number=0;pending=false;}else if(c==']'){if(pending||counts.empty())return "INVALID";int count=counts.back();counts.pop_back();string prefix=prefixes.back();prefixes.pop_back();if(prefix.size()+1LL*current.size()*count>10000)return "INVALID";string repeated;for(int i=0;i<count;i++)repeated+=current;current=prefix+repeated;}else if(c>='a'&&c<='z'){if(pending)return "INVALID";current+=c;if(current.size()>10000)return "INVALID";}else return "INVALID";}return pending||!counts.empty()?"INVALID":current;`,
      `frames=[]\ncurrent=""\nnumber=0\npending=False\nfor character in text:\n    if "0"<=character<="9":\n        if not pending and character=="0":\n            return "INVALID"\n        number=number*10+int(character);pending=True\n        if number>10000:\n            return "INVALID"\n    elif character=="[":\n        if not pending or number<1:\n            return "INVALID"\n        frames.append((current,number))\n        current="";number=0;pending=False\n    elif character=="]":\n        if pending or not frames:\n            return "INVALID"\n        prefix,count=frames.pop()\n        if len(prefix)+len(current)*count>10000:\n            return "INVALID"\n        current=prefix+current*count\n    elif "a"<=character<="z":\n        if pending:\n            return "INVALID"\n        current+=character\n        if len(current)>10000:\n            return "INVALID"\n    else:\n        return "INVALID"\nreturn "INVALID" if pending or frames else current`,
    ),
  },
);
