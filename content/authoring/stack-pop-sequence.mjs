import { seeded } from "./pack-builder.mjs";
import { independentPopPermutation } from "./stack-pop-pattern.mjs";
const int = { kind: "integer", minimum: -1000000, maximum: 1000000 },
  array = { kind: "array", maxLength: 2000, items: int };
function simulate({ pushes, pops }) {
  if (pushes.length !== pops.length) return false;
  const stack = [];
  let next = 0;
  for (const value of pushes) {
    stack.push(value);
    while (stack.length && next < pops.length && stack.at(-1) === pops[next]) {
      stack.pop();
      next++;
    }
  }
  return next === pops.length && stack.length === 0;
}
function generated() {
  const r = seeded(0x5788),
    out = [];
  for (let i = 0; i < 750; i++) {
    const size = 1 + ((r() >>> 16) % 9),
      ids = new Set();
    while (ids.size < size) ids.add(((r() >>> 16) % 1000) - 500);
    const pushes = [...ids],
      pops = [...pushes];
    for (let j = pops.length - 1; j > 0; j--) {
      const index = (r() >>> 16) % (j + 1);
      [pops[index], pops[j]] = [pops[j], pops[index]];
    }
    if (i % 11 === 0) pops[pops.length - 1] = 1000000;
    if (i % 17 === 0) pops.pop();
    out.push({
      input: { pushes, pops },
      category:
        i % 11 === 0
          ? "foreign-pop-id"
          : i % 17 === 0
            ? "missing-pop"
            : "candidate-interleaving",
    });
  }
  return out;
}
export const popSequenceDefinition = {
  id: "stack-08",
  slug: "validate-interleaved-pop-order",
  title: "Can this pop order happen?",
  primaryTopic: "stack",
  generatorModule: "content/authoring/stack-pop-sequence.mjs",
  step: 2,
  skillIds: ["stack.interleaved-schedule-validation"],
  prerequisites: ["stack.push-pop-history"],
  checkpointIds: ["stack-07", "stack-10"],
  remedialIds: ["stack-02"],
  nextIds: ["stack-04"],
  objective:
    "Validate whether pushing unique labels in a fixed order can produce a proposed pop order by interleaving operations.",
  rationale:
    "The operations are not given explicitly; simulate the next required pop while respecting the fixed push order.",
  statement:
    "The unique integer labels in `pushes` must be pushed onto one initially empty stack in that exact order. You may pop between pushes. Return whether the sequence of popped labels can be exactly `pops`, with every pushed label popped once. If pops has a wrong length, an unknown label, or a repeated label, return false. Labels are identifiers; their numerical size does not change stack order.",
  constraints: [
    "0 ≤ pushes.length and pops.length ≤ 2,000",
    "Labels are integers in [-1,000,000,1,000,000].",
    "pushes contains no duplicate label.",
  ],
  interface: "Solution.solve(pushes,pops) returns a boolean.",
  inputSchema: { kind: "object", properties: { pushes: array, pops: array } },
  outputSchema: { kind: "boolean" },
  semanticConstraints: [{ kind: "unique", field: "pushes" }],
  valid: ({ pushes }) => new Set(pushes).size === pushes.length,
  function: {
    arguments: [
      { name: "pushes", type: "int[]" },
      { name: "pops", type: "int[]" },
    ],
    returnType: "boolean",
  },
  visible: [
    {
      input: { pushes: [1, 2, 3], pops: [2, 3, 1] },
      expected: true,
      explanation: "Push 1, push and pop 2, push and pop 3, then pop 1.",
    },
    {
      input: { pushes: [], pops: [] },
      expected: true,
      explanation: "The empty schedule needs no operation.",
    },
    {
      input: { pushes: [1, 2, 3], pops: [3, 1, 2] },
      expected: false,
      explanation: "After 3 is popped, 2 is above 1 and cannot be skipped.",
    },
  ],
  generate: generated,
  oracle: simulate,
  independent: ({ pushes, pops }) => {
    if (pushes.length > 64) return independentPopPermutation({ pushes, pops });
    if (
      pushes.length !== pops.length ||
      new Set(pops).size !== pops.length ||
      pops.some((x) => !pushes.includes(x))
    )
      return false;
    const memo = new Map();
    function search(pushed, popped, stack) {
      if (popped === pops.length)
        return pushed === pushes.length && stack.length === 0;
      const key = [pushed, popped, stack.join(",")].join("|");
      if (memo.has(key)) return memo.get(key);
      let yes = false;
      if (stack.length && stack.at(-1) === pops[popped])
        yes = search(pushed, popped + 1, stack.slice(0, -1));
      if (!yes && pushed < pushes.length)
        yes = search(pushed + 1, popped, [...stack, pushes[pushed]]);
      memo.set(key, yes);
      return yes;
    }
    return search(0, 0, []);
  },
  mutations: {
    "same-labels-ignore-stack-order": ({ pushes, pops }) =>
      pushes.length === pops.length &&
      new Set(pops).size === pops.length &&
      pops.every((x) => pushes.includes(x)),
    "push-everything-before-popping": ({ pushes, pops }) =>
      JSON.stringify([...pushes].reverse()) === JSON.stringify(pops),
  },
  languages: {
    java: {
      starter:
        "class Solution {public boolean solve(int[] pushes,int[] pops){return false;}}",
      reference:
        "class Solution {public boolean solve(int[] pushes,int[] pops){if(pushes.length!=pops.length)return false;int[] stack=new int[pushes.length];int size=0,next=0;for(int value:pushes){stack[size++]=value;while(size>0&&next<pops.length&&stack[size-1]==pops[next]){size--;next++;}}return next==pops.length&&size==0;}}",
    },
    cpp: {
      starter:
        "class Solution {public:bool solve(vector<int> pushes,vector<int> pops){return false;}};",
      reference:
        "class Solution {public:bool solve(vector<int> pushes,vector<int> pops){if(pushes.size()!=pops.size())return false;vector<int> stack;int next=0;for(int value:pushes){stack.push_back(value);while(!stack.empty()&&next<(int)pops.size()&&stack.back()==pops[next]){stack.pop_back();next++;}}return next==(int)pops.size()&&stack.empty();}};",
    },
    python: {
      starter:
        "class Solution:\n    def solve(self, pushes, pops):\n        return False\n",
      reference:
        "class Solution:\n    def solve(self, pushes, pops):\n        if len(pushes)!=len(pops):\n            return False\n        stack=[]\n        next_pop=0\n        for value in pushes:\n            stack.append(value)\n            while stack and next_pop<len(pops) and stack[-1]==pops[next_pop]:\n                stack.pop()\n                next_pop+=1\n        return next_pop==len(pops) and not stack\n",
    },
  },
};
