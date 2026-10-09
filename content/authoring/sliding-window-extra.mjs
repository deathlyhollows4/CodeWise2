import { seeded } from "./pack-builder.mjs";
const int = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const arr = { kind: "array", maxLength: 2000, items: int };
const positive = {
    ...arr,
    items: { kind: "integer", minimum: 1, maximum: 1000000 },
  },
  nonnegative = {
    ...arr,
    items: { kind: "integer", minimum: 0, maximum: 1000000 },
  };
const result = { kind: "integer", minimum: 0, maximum: 2000 };
const text = { kind: "string", ascii: true, maxLength: 2000 };
const vk = [
  { name: "values", type: "int[]" },
  { name: "k", type: "int" },
];
const vt = [
  { name: "values", type: "int[]" },
  { name: "target", type: "long" },
];
const ts = [{ name: "text", type: "string" }];
const types = {
  int: ["int", "int"],
  long: ["long", "long long"],
  string: ["String", "string"],
  "int[]": ["int[]", "vector<int>"],
};
function langs(args, ret, j, c, p) {
  const zero = ret === "string" ? '""' : ret === "int[]" ? null : "0";
  const argument = (i) =>
    args.map((a) => `${types[a.type][i]} ${a.name}`).join(",");
  return {
    java: {
      starter: `class Solution {public ${types[ret][0]} solve(${argument(0)}){return ${zero ?? "new int[0]"};}}`,
      reference: `class Solution {public ${types[ret][0]} solve(${argument(0)}){${j}}}`,
    },
    cpp: {
      starter: `class Solution {public:${types[ret][1]} solve(${argument(1)}){return ${zero ?? "{}"};}};`,
      reference: `class Solution {public:${types[ret][1]} solve(${argument(1)}){${c}}};`,
    },
    python: {
      starter: `class Solution:\n    def solve(self, ${args.map((a) => a.name).join(", ")}):\n        return ${zero ?? "[]"}\n`,
      reference: `class Solution:\n    def solve(self, ${args.map((a) => a.name).join(", ")}):\n${p
        .split("\n")
        .map((line) => "        " + line)
        .join("\n")}\n`,
    },
  };
}
const common = {
  primaryTopic: "sliding-window",
  generatorModule: "content/authoring/sliding-window-extra.mjs",
  checker: { kind: "exact" },
};
function arraysWith(field, positiveOnly = false) {
  const r = seeded(0x51a3),
    out = [];
  for (let i = 0; i < 720; i++)
    out.push({
      input: {
        values: Array.from(
          { length: (r() >>> 16) % 27 },
          () => ((r() >>> 16) % 11) + (positiveOnly ? 1 : 0),
        ),
        [field]: 1 + ((r() >>> 16) % 90),
      },
      category: "sum-boundary-and-empty",
    });
  return out;
}
function textInputs() {
  const r = seeded(0x51a4);
  return Array.from({ length: 750 }, () => ({
    input: {
      text: Array.from({ length: (r() >>> 16) % 30 }, () =>
        String.fromCharCode(97 + ((r() >>> 16) % 6)),
      ).join(""),
      pattern: Array.from({ length: (r() >>> 16) % 8 }, () =>
        String.fromCharCode(97 + ((r() >>> 16) % 6)),
      ).join(""),
    },
    category: "letter-multiplicities",
  }));
}
function shortest({ values, target }) {
  let left = 0,
    total = 0,
    best = Infinity;
  for (let right = 0; right < values.length; right++) {
    total += values[right];
    while (total >= target) {
      best = Math.min(best, right - left + 1);
      total -= values[left++];
    }
  }
  return Number.isFinite(best) ? best : 0;
}
function unique({ text }) {
  let left = 0,
    best = 0;
  const last = new Map();
  for (let right = 0; right < text.length; right++) {
    left = Math.max(left, (last.get(text[right]) ?? -1) + 1);
    last.set(text[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
function binaryInputs() {
  const r = seeded(0x51a5);
  return Array.from({ length: 720 }, () => ({
    input: {
      values: Array.from({ length: (r() >>> 16) % 30 }, () => (r() >>> 16) % 2),
      k: (r() >>> 16) % 9,
    },
    category: "zero-budget-window",
  }));
}
function ones({ values, k }) {
  let left = 0,
    zeros = 0,
    best = 0;
  for (let right = 0; right < values.length; right++) {
    if (!values[right]) zeros++;
    while (zeros > k) if (!values[left++]) zeros--;
    best = Math.max(best, right - left + 1);
  }
  return best;
}
export const extraDefinitions = [
  {
    ...common,
    id: "sliding-window-03",
    slug: "shortest-positive-target-batch",
    title: "Shortest batch reaching a target",
    step: 2,
    skillIds: ["windows.variable-shrink", "windows.positive-sum"],
    prerequisites: ["windows.fixed-boundaries"],
    checkpointIds: ["sliding-window-09"],
    nextIds: ["sliding-window-04"],
    objective:
      "Shrink a valid positive-sum window to find the smallest qualifying batch.",
    rationale:
      "The window length changes now; positive values make shrinking predictable.",
    statement:
      "Return the smallest length of a contiguous nonempty batch whose total is at least `target`. Values are strictly positive. Return zero if no batch reaches the target. Empty input has no qualifying batch.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "1 ≤ each value ≤ 1,000,000",
      "1 ≤ target ≤ 2,000,000,000.",
    ],
    interface: "Solution.solve(values,target) returns a length or zero.",
    inputSchema: {
      kind: "object",
      properties: {
        values: positive,
        target: { kind: "integer", minimum: 1, maximum: 2000000000 },
      },
    },
    outputSchema: result,
    function: { arguments: vt, returnType: "int" },
    visible: [
      {
        input: { values: [2, 3, 1, 2, 4], target: 6 },
        expected: 2,
        explanation: "The final batch [2,4] reaches 6 using two entries.",
      },
      {
        input: { values: [], target: 1 },
        expected: 0,
        explanation: "There is no nonempty batch.",
      },
      {
        input: { values: [1, 1, 1], target: 4 },
        expected: 0,
        explanation: "Even the entire array is too small.",
      },
    ],
    generate: () => arraysWith("target", true),
    oracle: shortest,
    independent: ({ values, target }) => {
      let best = Infinity;
      for (let i = 0; i < values.length; i++) {
        let total = 0;
        for (let j = i; j < values.length; j++) {
          total += values[j];
          if (total >= target) {
            best = Math.min(best, j - i + 1);
            break;
          }
        }
      }
      return Number.isFinite(best) ? best : 0;
    },
    mutations: {
      "exact-total-only": ({ values, target }) => {
        let best = Infinity;
        for (let i = 0; i < values.length; i++) {
          let total = 0;
          for (let j = i; j < values.length; j++) {
            total += values[j];
            if (total === target) best = Math.min(best, j - i + 1);
          }
        }
        return Number.isFinite(best) ? best : 0;
      },
      "only-prefix": ({ values, target }) => {
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
          sum += values[i];
          if (sum >= target) return i + 1;
        }
        return 0;
      },
    },
    languages: langs(
      vt,
      "int",
      `int left=0,best=values.length+1;long total=0;for(int right=0;right<values.length;right++){total+=values[right];while(total>=target){best=Math.min(best,right-left+1);total-=values[left++];}}return best>values.length?0:best;`,
      `int left=0,best=values.size()+1;long long total=0;for(int right=0;right<(int)values.size();right++){total+=values[right];while(total>=target){best=min(best,right-left+1);total-=values[left++];}}return best>(int)values.size()?0:best;`,
      `left=total=0\nbest=len(values)+1\nfor right,value in enumerate(values):\n    total+=value\n    while total>=target:\n        best=min(best,right-left+1)\n        total-=values[left];left+=1\nreturn 0 if best>len(values) else best`,
    ),
  },
  {
    ...common,
    id: "sliding-window-04",
    slug: "longest-unrepeated-letter-span",
    title: "Longest unrepeated letter span",
    step: 3,
    skillIds: ["windows.last-occurrence-boundary"],
    prerequisites: ["windows.variable-shrink", "hashing.membership"],
    checkpointIds: ["sliding-window-05"],
    nextIds: ["sliding-window-06"],
    objective:
      "Move the left boundary past the last occurrence of a repeated letter.",
    rationale:
      "A lookup now identifies the boundary that removes a repetition.",
    statement:
      "Return the length of the longest contiguous part of lowercase ASCII `text` containing no repeated letter. A letter may appear elsewhere outside the chosen part. Empty text returns zero.",
    constraints: [
      "0 ≤ text.length ≤ 2,000",
      "Only lowercase ASCII letters a..z occur.",
    ],
    interface: "Solution.solve(text) returns an integer length.",
    inputSchema: { kind: "object", properties: { text } },
    outputSchema: result,
    function: { arguments: ts, returnType: "int" },
    semanticConstraints: [
      { kind: "alphabet", field: "text", alphabet: "lowercase" },
    ],
    valid: ({ text }) => /^[a-z]*$/.test(text),
    visible: [
      {
        input: { text: "abcaac" },
        expected: 3,
        explanation: "abc and bca each contain three different letters.",
      },
      {
        input: { text: "" },
        expected: 0,
        explanation: "There is no letter span.",
      },
      {
        input: { text: "aaaa" },
        expected: 1,
        explanation: "Any longer span repeats a.",
      },
    ],
    generate: () =>
      textInputs().map((c) => ({
        input: { text: c.input.text },
        category: c.category,
      })),
    oracle: unique,
    independent: ({ text }) => {
      let best = 0;
      for (let i = 0; i < text.length; i++) {
        const seen = new Set();
        for (let j = i; j < text.length; j++) {
          if (seen.has(text[j])) break;
          seen.add(text[j]);
          best = Math.max(best, j - i + 1);
        }
      }
      return best;
    },
    mutations: {
      "total-distinct-letters": ({ text }) => new Set(text).size,
      "never-shrink": ({ text }) => text.length,
    },
    languages: langs(
      ts,
      "int",
      `int[] last=new int[26];Arrays.fill(last,-1);int left=0,best=0;for(int right=0;right<text.length();right++){int c=text.charAt(right)-'a';left=Math.max(left,last[c]+1);last[c]=right;best=Math.max(best,right-left+1);}return best;`,
      `vector<int> last(26,-1);int left=0,best=0;for(int right=0;right<(int)text.size();right++){int c=text[right]-'a';left=max(left,last[c]+1);last[c]=right;best=max(best,right-left+1);}return best;`,
      `last={}\nleft=best=0\nfor right,character in enumerate(text):\n    left=max(left,last.get(character,-1)+1)\n    last[character]=right\n    best=max(best,right-left+1)\nreturn best`,
    ),
  },
  {
    ...common,
    id: "sliding-window-05",
    slug: "binary-span-with-repairs",
    title: "A binary span with limited repairs",
    step: 3,
    skillIds: ["windows.violation-budget"],
    prerequisites: ["windows.variable-shrink"],
    checkpointIds: ["sliding-window-04"],
    nextIds: ["sliding-window-06"],
    objective:
      "Keep the number of zero readings within a repair budget as the window moves.",
    rationale: "Validity now depends on a count rather than a total.",
    statement:
      "Every reading is 0 or 1. You may treat at most `k` zeros as repaired ones. Return the greatest length of a contiguous batch that can become entirely ones. You do not have to use every repair. Empty input returns zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each entry is exactly 0 or 1.",
      "0 ≤ k ≤ 2,000.",
    ],
    interface: "Solution.solve(values,k) returns a length.",
    inputSchema: {
      kind: "object",
      properties: {
        values: { ...arr, items: { kind: "integer", minimum: 0, maximum: 1 } },
        k: { kind: "integer", minimum: 0, maximum: 2000 },
      },
    },
    outputSchema: result,
    function: { arguments: vk, returnType: "int" },
    visible: [
      {
        input: { values: [1, 0, 1, 1, 0], k: 1 },
        expected: 4,
        explanation: "Repair the zero in the first four positions.",
      },
      {
        input: { values: [], k: 0 },
        expected: 0,
        explanation: "There is no batch.",
      },
      {
        input: { values: [0, 0, 0], k: 0 },
        expected: 0,
        explanation: "Without repairs, a zero cannot join an all-one batch.",
      },
    ],
    generate: binaryInputs,
    oracle: ones,
    independent: ({ values, k }) => {
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        let zero = 0;
        for (let j = i; j < values.length; j++) {
          zero += values[j] === 0 ? 1 : 0;
          if (zero <= k) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    },
    mutations: {
      "ignore-budget": ({ values }) => values.length,
      "exact-budget-only": ({ values, k }) => {
        let best = 0;
        for (let i = 0; i < values.length; i++) {
          let zero = 0;
          for (let j = i; j < values.length; j++) {
            zero += values[j] === 0 ? 1 : 0;
            if (zero === k) best = Math.max(best, j - i + 1);
          }
        }
        return best;
      },
    },
    languages: langs(
      vk,
      "int",
      `int left=0,zeros=0,best=0;for(int right=0;right<values.length;right++){if(values[right]==0)zeros++;while(zeros>k)if(values[left++]==0)zeros--;best=Math.max(best,right-left+1);}return best;`,
      `int left=0,zeros=0,best=0;for(int right=0;right<(int)values.size();right++){if(values[right]==0)zeros++;while(zeros>k)if(values[left++]==0)zeros--;best=max(best,right-left+1);}return best;`,
      `left=zeros=best=0\nfor right,value in enumerate(values):\n    zeros+=int(value==0)\n    while zeros>k:\n        zeros-=int(values[left]==0);left+=1\n    best=max(best,right-left+1)\nreturn best`,
    ),
  },
];
function minimumCover({ text, pattern }) {
  if (!pattern) return "";
  const need = {};
  for (const c of pattern) need[c] = (need[c] || 0) + 1;
  let missing = pattern.length,
    left = 0,
    start = 0,
    best = Infinity;
  for (let right = 0; right < text.length; right++) {
    const c = text[right];
    if ((need[c] || 0) > 0) missing--;
    need[c] = (need[c] || 0) - 1;
    while (missing === 0) {
      if (right - left + 1 < best) {
        best = right - left + 1;
        start = left;
      }
      const old = text[left++];
      need[old] = (need[old] || 0) + 1;
      if (need[old] > 0) missing++;
    }
  }
  return Number.isFinite(best) ? text.slice(start, start + best) : "";
}
function coverBrute({ text, pattern }) {
  if (!pattern) return "";
  const need = {};
  for (const c of pattern) need[c] = (need[c] || 0) + 1;
  let best = "",
    length = Infinity;
  for (let i = 0; i < text.length; i++) {
    const have = {};
    for (let j = i; j < text.length; j++) {
      have[text[j]] = (have[text[j]] || 0) + 1;
      if (Object.keys(need).every((c) => (have[c] || 0) >= need[c])) {
        if (j - i + 1 < length) {
          length = j - i + 1;
          best = text.slice(i, j + 1);
        }
        break;
      }
    }
  }
  return best;
}
const tp = [
  { name: "text", type: "string" },
  { name: "pattern", type: "string" },
];
const letterSemantics = [
  { kind: "alphabet", field: "text", alphabet: "lowercase" },
  { kind: "alphabet", field: "pattern", alphabet: "lowercase" },
];
const letterValid = ({ text, pattern }) =>
  /^[a-z]*$/.test(text) && /^[a-z]*$/.test(pattern);
const textPair = { kind: "object", properties: { text, pattern: text } };
function starts({ text, pattern }) {
  if (!pattern) return [];
  const wanted = Array(26).fill(0),
    have = Array(26).fill(0),
    out = [];
  for (const c of pattern) wanted[c.charCodeAt(0) - 97]++;
  for (let right = 0; right < text.length; right++) {
    have[text.charCodeAt(right) - 97]++;
    if (right >= pattern.length)
      have[text.charCodeAt(right - pattern.length) - 97]--;
    if (right >= pattern.length - 1 && have.every((v, i) => v === wanted[i]))
      out.push(right - pattern.length + 1);
  }
  return out;
}
function fixedWindows() {
  const r = seeded(0x51a8);
  return Array.from({ length: 700 }, () => {
    const n = 1 + ((r() >>> 16) % 27);
    return {
      input: {
        values: Array.from({ length: n }, () => ((r() >>> 16) % 51) - 25),
        k: 1 + ((r() >>> 16) % n),
      },
      category: "fixed-window-extrema",
    };
  });
}
extraDefinitions.push(
  {
    ...common,
    id: "sliding-window-06",
    slug: "shortest-letter-cover",
    title: "Shortest letter cover",
    step: 4,
    skillIds: ["windows.required-multiplicity", "windows.minimum-cover"],
    prerequisites: ["windows.variable-shrink", "hashing.counts"],
    checkpointIds: ["sliding-window-07"],
    nextIds: ["sliding-window-08"],
    objective:
      "Track which required letter copies remain missing while shrinking a complete cover.",
    rationale:
      "The window must cover a whole required multiset, not just one numeric budget.",
    statement:
      "Return the shortest contiguous part of `text` containing every letter from `pattern` with at least the same multiplicity. Extra letters are allowed. If several shortest parts exist, choose the earliest starting position. If no cover exists, return the empty string. An empty pattern also returns the empty string.",
    constraints: [
      "0 ≤ text.length and pattern.length ≤ 2,000",
      "Both strings use lowercase ASCII letters a..z.",
    ],
    interface: "Solution.solve(text,pattern) returns the chosen substring.",
    inputSchema: textPair,
    outputSchema: text,
    function: { arguments: tp, returnType: "string" },
    semanticConstraints: letterSemantics,
    valid: letterValid,
    visible: [
      {
        input: { text: "bacabb", pattern: "ab" },
        expected: "ba",
        explanation: "ba at the beginning is the earliest cover of length two.",
      },
      {
        input: { text: "abc", pattern: "" },
        expected: "",
        explanation: "An empty requirement needs no substring.",
      },
      {
        input: { text: "aab", pattern: "aa" },
        expected: "aa",
        explanation: "Both copies of a are required.",
      },
    ],
    generate: textInputs,
    oracle: minimumCover,
    independent: coverBrute,
    mutations: {
      "ignore-required-multiplicity": ({ text, pattern }) =>
        minimumCover({ text, pattern: [...new Set(pattern)].join("") }),
      "choose-entire-text": ({ text, pattern }) =>
        minimumCover({ text, pattern }) ? text : "",
    },
    languages: langs(
      tp,
      "string",
      `if(pattern.length()==0)return "";int[] need=new int[26];for(char c:pattern.toCharArray())need[c-'a']++;int missing=pattern.length(),left=0,start=0,best=Integer.MAX_VALUE;for(int right=0;right<text.length();right++){int c=text.charAt(right)-'a';if(need[c]>0)missing--;need[c]--;while(missing==0){if(right-left+1<best){best=right-left+1;start=left;}int old=text.charAt(left++)-'a';if(++need[old]>0)missing++;}}return best==Integer.MAX_VALUE?"":text.substring(start,start+best);`,
      `if(pattern.empty())return "";vector<int> need(26);for(char c:pattern)need[c-'a']++;int missing=pattern.size(),left=0,start=0,best=INT_MAX;for(int right=0;right<(int)text.size();right++){int c=text[right]-'a';if(need[c]>0)missing--;need[c]--;while(missing==0){if(right-left+1<best){best=right-left+1;start=left;}int old=text[left++]-'a';if(++need[old]>0)missing++;}}return best==INT_MAX?"":text.substr(start,best);`,
      `if not pattern:\n    return ""\nneed={}\nfor character in pattern:\n    need[character]=need.get(character,0)+1\nmissing=len(pattern)\nleft=start=0\nbest=len(text)+1\nfor right,character in enumerate(text):\n    if need.get(character,0)>0:\n        missing-=1\n    need[character]=need.get(character,0)-1\n    while missing==0:\n        if right-left+1<best:\n            best=right-left+1;start=left\n        old=text[left];left+=1\n        need[old]=need.get(old,0)+1\n        if need[old]>0:\n            missing+=1\nreturn "" if best>len(text) else text[start:start+best]`,
    ),
  },
  {
    ...common,
    id: "sliding-window-07",
    slug: "find-rearranged-pattern-starts",
    title: "Find rearranged pattern starts",
    step: 4,
    skillIds: ["windows.fixed-frequency-equality"],
    prerequisites: ["windows.frequency-removal", "hashing.counts"],
    checkpointIds: ["sliding-window-06"],
    nextIds: ["sliding-window-08"],
    objective:
      "Compare a fixed window letter multiset with a pattern and report overlapping matches.",
    rationale:
      "Reuse frequency state at each position instead of rebuilding a pattern comparison.",
    statement:
      "Return all starting indices where a contiguous part of `text` has the same length and exactly the same letter counts as `pattern`. The order of letters within that part does not matter. Output zero-based indices in ascending order. Matches may overlap. An empty pattern produces no matches.",
    constraints: [
      "0 ≤ text.length and pattern.length ≤ 2,000",
      "Both strings contain lowercase ASCII letters a..z.",
    ],
    interface: "Solution.solve(text,pattern) returns an integer index array.",
    inputSchema: textPair,
    outputSchema: {
      kind: "array",
      maxLength: 2000,
      items: { kind: "integer", minimum: 0, maximum: 1999 },
    },
    function: { arguments: tp, returnType: "int[]" },
    semanticConstraints: letterSemantics,
    valid: letterValid,
    visible: [
      {
        input: { text: "cabaabb", pattern: "ab" },
        expected: [1, 2, 4],
        explanation:
          "ab, ba, and the later ab have the required two letter counts.",
      },
      {
        input: { text: "", pattern: "a" },
        expected: [],
        explanation: "The text is too short.",
      },
      {
        input: { text: "aaaa", pattern: "aa" },
        expected: [0, 1, 2],
        explanation: "Overlapping length-two matches are all included.",
      },
    ],
    generate: textInputs,
    oracle: starts,
    independent: ({ text, pattern }) => {
      if (!pattern) return [];
      const key = [...pattern].sort().join(""),
        out = [];
      for (let i = 0; i + pattern.length <= text.length; i++)
        if ([...text.slice(i, i + pattern.length)].sort().join("") === key)
          out.push(i);
      return out;
    },
    mutations: {
      "match-only-exact-order": ({ text, pattern }) => {
        if (!pattern) return [];
        const out = [];
        for (let i = 0; i + pattern.length <= text.length; i++)
          if (text.slice(i, i + pattern.length) === pattern) out.push(i);
        return out;
      },
      "discard-overlap": (input) => {
        const out = starts(input);
        let end = -1;
        return out.filter((i) => {
          if (i < end) return false;
          end = i + input.pattern.length;
          return true;
        });
      },
    },
    languages: langs(
      tp,
      "int[]",
      `if(pattern.length()==0)return new int[0];int[] want=new int[26],have=new int[26];for(char c:pattern.toCharArray())want[c-'a']++;ArrayList<Integer> out=new ArrayList<>();for(int r=0;r<text.length();r++){have[text.charAt(r)-'a']++;if(r>=pattern.length())have[text.charAt(r-pattern.length())-'a']--;if(r>=pattern.length()-1&&Arrays.equals(want,have))out.add(r-pattern.length()+1);}int[] answer=new int[out.size()];for(int i=0;i<answer.length;i++)answer[i]=out.get(i);return answer;`,
      `if(pattern.empty())return {};vector<int> want(26),have(26),out;for(char c:pattern)want[c-'a']++;for(int r=0;r<(int)text.size();r++){have[text[r]-'a']++;if(r>=(int)pattern.size())have[text[r-pattern.size()]-'a']--;if(r>=(int)pattern.size()-1&&have==want)out.push_back(r-pattern.size()+1);}return out;`,
      `if not pattern:\n    return []\nwant=[0]*26\nhave=[0]*26\nfor character in pattern:\n    want[ord(character)-97]+=1\nout=[]\nfor right,character in enumerate(text):\n    have[ord(character)-97]+=1\n    if right>=len(pattern):\n        have[ord(text[right-len(pattern)])-97]-=1\n    if right>=len(pattern)-1 and have==want:\n        out.append(right-len(pattern)+1)\nreturn out`,
    ),
  },
  {
    ...common,
    id: "sliding-window-08",
    slug: "maximum-for-every-batch",
    title: "Maximum for every batch",
    step: 5,
    skillIds: ["windows.monotonic-deque", "windows.expiring-candidates"],
    prerequisites: ["windows.fixed-boundaries", "stack.monotonic-candidates"],
    checkpointIds: ["sliding-window-12"],
    remedialIds: ["sliding-window-01"],
    objective:
      "Retain decreasing candidate maxima and remove expired positions.",
    rationale:
      "A moving maximum needs more information than a total: old candidates can expire.",
    statement:
      "For each contiguous batch of exactly `k` entries in `values`, return its maximum value. Return maxima in the order of batch starting positions. Negative and duplicate values are allowed. The result has values.length - k + 1 entries.",
    constraints: [
      "1 ≤ values.length ≤ 2,000",
      "1 ≤ k ≤ values.length",
      "Each value is in [-1,000,000,1,000,000].",
    ],
    interface: "Solution.solve(values,k) returns an integer array.",
    inputSchema: {
      kind: "object",
      properties: {
        values: { ...arr, minLength: 1 },
        k: { kind: "integer", minimum: 1, maximum: 2000 },
      },
    },
    outputSchema: { ...arr, minLength: 1 },
    function: { arguments: vk, returnType: "int[]" },
    semanticConstraints: [
      {
        kind: "length-relative",
        field: "k",
        array: "values",
        minimum: 1,
        maxOffset: 0,
      },
    ],
    valid: ({ values, k }) => k <= values.length,
    visible: [
      {
        input: { values: [2, 1, 3, 2], k: 2 },
        expected: [2, 3, 3],
        explanation: "Maxima for [2,1], [1,3], and [3,2] are 2, 3, and 3.",
      },
      {
        input: { values: [-8], k: 1 },
        expected: [-8],
        explanation: "A length-one window keeps the negative value.",
      },
      {
        input: { values: [4, 4, 4], k: 2 },
        expected: [4, 4],
        explanation: "Equal maxima remain valid when older positions expire.",
      },
    ],
    generate: fixedWindows,
    oracle: ({ values, k }) =>
      Array.from({ length: values.length - k + 1 }, (_, i) =>
        Math.max(...values.slice(i, i + k)),
      ),
    independent: ({ values, k }) =>
      Array.from(
        { length: values.length - k + 1 },
        (_, i) => values.slice(i, i + k).sort((a, b) => b - a)[0],
      ),
    mutations: {
      "minimum-instead-of-maximum": ({ values, k }) =>
        Array.from({ length: values.length - k + 1 }, (_, i) =>
          Math.min(...values.slice(i, i + k)),
        ),
      "global-maximum-for-all": ({ values, k }) =>
        Array(values.length - k + 1).fill(Math.max(...values)),
    },
    languages: langs(
      vk,
      "int[]",
      `ArrayDeque<Integer> q=new ArrayDeque<>();int[] out=new int[values.length-k+1];for(int i=0;i<values.length;i++){while(!q.isEmpty()&&q.peekFirst()<=i-k)q.removeFirst();while(!q.isEmpty()&&values[q.peekLast()]<=values[i])q.removeLast();q.addLast(i);if(i>=k-1)out[i-k+1]=values[q.peekFirst()];}return out;`,
      `deque<int> q;vector<int> out;for(int i=0;i<(int)values.size();i++){while(!q.empty()&&q.front()<=i-k)q.pop_front();while(!q.empty()&&values[q.back()]<=values[i])q.pop_back();q.push_back(i);if(i>=k-1)out.push_back(values[q.front()]);}return out;`,
      `from collections import deque\nq=deque()\nout=[]\nfor i,value in enumerate(values):\n    while q and q[0]<=i-k:\n        q.popleft()\n    while q and values[q[-1]]<=value:\n        q.pop()\n    q.append(i)\n    if i>=k-1:\n        out.append(values[q[0]])\nreturn out`,
    ),
  },
);
function varied(kMin = 0) {
  const r = seeded(0x51aa);
  return Array.from({ length: 740 }, () => ({
    input: {
      values: Array.from(
        { length: (r() >>> 16) % 27 },
        () => ((r() >>> 16) % 9) - 4,
      ),
      k: kMin + ((r() >>> 16) % 8),
    },
    category: "repeated-variety-budget",
  }));
}
function longestVariety({ values, k }) {
  const counts = new Map();
  let left = 0,
    best = 0;
  for (let right = 0; right < values.length; right++) {
    const value = values[right];
    counts.set(value, (counts.get(value) || 0) + 1);
    while (counts.size > k) {
      const old = values[left++],
        next = counts.get(old) - 1;
      if (next) counts.set(old, next);
      else counts.delete(old);
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
function shortestVariety({ values, k }) {
  const counts = new Map();
  let left = 0,
    best = Infinity;
  for (let right = 0; right < values.length; right++) {
    const value = values[right];
    counts.set(value, (counts.get(value) || 0) + 1);
    while (counts.size >= k) {
      best = Math.min(best, right - left + 1);
      const old = values[left++],
        next = counts.get(old) - 1;
      if (next) counts.set(old, next);
      else counts.delete(old);
    }
  }
  return Number.isFinite(best) ? best : 0;
}
function boundedCount({ values, limit }) {
  let left = 0,
    total = 0,
    count = 0;
  for (let right = 0; right < values.length; right++) {
    total += values[right];
    while (total > limit) total -= values[left++];
    count += right - left + 1;
  }
  return count;
}
function spreadInputs() {
  const r = seeded(0x51ab);
  return Array.from({ length: 730 }, () => ({
    input: {
      values: Array.from(
        { length: (r() >>> 16) % 27 },
        () => ((r() >>> 16) % 41) - 20,
      ),
      limit: (r() >>> 16) % 25,
    },
    category: "signed-spread-boundaries",
  }));
}
function spread({ values, limit }) {
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    let lo = Infinity,
      hi = -Infinity;
    for (let j = i; j < values.length; j++) {
      lo = Math.min(lo, values[j]);
      hi = Math.max(hi, values[j]);
      if (hi - lo <= limit) best = Math.max(best, j - i + 1);
      else break;
    }
  }
  return best;
}
const vl = [
  { name: "values", type: "int[]" },
  { name: "limit", type: "long" },
];
extraDefinitions.push(
  {
    ...common,
    id: "sliding-window-09",
    slug: "count-batches-within-total",
    title: "Count batches within a total limit",
    step: 2,
    skillIds: ["windows.count-valid-endings"],
    prerequisites: ["windows.positive-sum"],
    checkpointIds: ["sliding-window-03"],
    nextIds: ["sliding-window-04"],
    objective:
      "Count all valid subarrays ending at each right boundary instead of only one optimum.",
    rationale:
      "Once a nonnegative window fits the limit, every shorter suffix ending there fits too.",
    statement:
      "Return the number of nonempty contiguous batches in nonnegative `values` whose total is at most `limit`. Different starting or ending positions are different batches, even if their values are equal. Zero values and a zero limit are valid. Empty input returns zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "0 ≤ each value ≤ 1,000,000",
      "0 ≤ limit ≤ 2,000,000,000.",
    ],
    interface: "Solution.solve(values,limit) returns a 64-bit integer count.",
    inputSchema: {
      kind: "object",
      properties: {
        values: nonnegative,
        limit: { kind: "integer", minimum: 0, maximum: 2000000000 },
      },
    },
    outputSchema: { kind: "safe-integer" },
    function: { arguments: vl, returnType: "long" },
    visible: [
      {
        input: { values: [1, 2, 1], limit: 3 },
        expected: 5,
        explanation:
          "All three singletons and both length-two batches qualify.",
      },
      {
        input: { values: [], limit: 0 },
        expected: 0,
        explanation: "There is no nonempty batch.",
      },
      {
        input: { values: [0, 0], limit: 0 },
        expected: 3,
        explanation:
          "Both singleton positions and their combined batch total zero.",
      },
    ],
    generate: () =>
      arraysWith("limit").concat([
        {
          input: { values: Array(2000).fill(0), limit: 0 },
          category: "quadratic-count-of-zero-batches",
        },
      ]),
    oracle: boundedCount,
    independent: ({ values, limit }) => {
      let count = 0;
      for (let i = 0; i < values.length; i++) {
        let total = 0;
        for (let j = i; j < values.length; j++) {
          total += values[j];
          if (total <= limit) count++;
        }
      }
      return count;
    },
    mutations: {
      "singletons-only": ({ values, limit }) =>
        values.filter((v) => v <= limit).length,
      "strict-limit-only": ({ values, limit }) => {
        let count = 0;
        for (let i = 0; i < values.length; i++) {
          let total = 0;
          for (let j = i; j < values.length; j++) {
            total += values[j];
            if (total < limit) count++;
          }
        }
        return count;
      },
    },
    languages: langs(
      vl,
      "long",
      `int left=0;long total=0,count=0;for(int right=0;right<values.length;right++){total+=values[right];while(total>limit)total-=values[left++];count+=right-left+1;}return count;`,
      `int left=0;long long total=0,count=0;for(int right=0;right<(int)values.size();right++){total+=values[right];while(total>limit)total-=values[left++];count+=right-left+1;}return count;`,
      `left=total=count=0\nfor right,value in enumerate(values):\n    total+=value\n    while total>limit:\n        total-=values[left];left+=1\n    count+=right-left+1\nreturn count`,
    ),
  },
  {
    ...common,
    id: "sliding-window-10",
    slug: "longest-limited-variety-batch",
    title: "Longest batch with limited variety",
    step: 4,
    skillIds: ["windows.distinct-budget"],
    prerequisites: ["windows.frequency-removal", "windows.variable-shrink"],
    checkpointIds: ["sliding-window-11"],
    nextIds: ["sliding-window-08"],
    objective:
      "Maintain a frequency map while limiting the number of different values in the current batch.",
    rationale:
      "A fixed variety count becomes a variable-window validity condition.",
    statement:
      "Return the greatest length of a contiguous batch containing at most `k` different integer values. Repeated copies of one value count as one type. Empty input returns zero. When k is zero, only the empty batch qualifies, so return zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each value is in [-1,000,000,1,000,000].",
      "0 ≤ k ≤ 2,000.",
    ],
    interface: "Solution.solve(values,k) returns an integer length.",
    inputSchema: {
      kind: "object",
      properties: {
        values: arr,
        k: { kind: "integer", minimum: 0, maximum: 2000 },
      },
    },
    outputSchema: result,
    function: { arguments: vk, returnType: "int" },
    visible: [
      {
        input: { values: [1, 2, 1, 3, 3], k: 2 },
        expected: 3,
        explanation: "[1,2,1] is one longest batch with two types.",
      },
      {
        input: { values: [], k: 2 },
        expected: 0,
        explanation: "There is no batch.",
      },
      {
        input: { values: [1, 1], k: 0 },
        expected: 0,
        explanation: "Zero types allows no nonempty batch.",
      },
    ],
    generate: () => varied(0),
    oracle: longestVariety,
    independent: ({ values, k }) => {
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        const s = new Set();
        for (let j = i; j < values.length; j++) {
          s.add(values[j]);
          if (s.size <= k) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    },
    mutations: {
      "limit-length-instead-of-types": ({ values, k }) =>
        Math.min(values.length, k),
      "whole-array-if-total-variety-fits": ({ values, k }) =>
        new Set(values).size <= k ? values.length : 0,
    },
    languages: langs(
      vk,
      "int",
      `HashMap<Integer,Integer> counts=new HashMap<>();int left=0,best=0;for(int right=0;right<values.length;right++){counts.put(values[right],counts.getOrDefault(values[right],0)+1);while(counts.size()>k){int old=values[left++],next=counts.get(old)-1;if(next==0)counts.remove(old);else counts.put(old,next);}best=Math.max(best,right-left+1);}return best;`,
      `unordered_map<int,int> counts;int left=0,best=0;for(int right=0;right<(int)values.size();right++){counts[values[right]]++;while((int)counts.size()>k){int old=values[left++];if(--counts[old]==0)counts.erase(old);}best=max(best,right-left+1);}return best;`,
      `counts={}\nleft=best=0\nfor right,value in enumerate(values):\n    counts[value]=counts.get(value,0)+1\n    while len(counts)>k:\n        old=values[left];left+=1\n        counts[old]-=1\n        if counts[old]==0:\n            del counts[old]\n    best=max(best,right-left+1)\nreturn best`,
    ),
  },
  {
    ...common,
    id: "sliding-window-11",
    slug: "shortest-variety-cover",
    title: "Shortest batch reaching enough variety",
    step: 4,
    skillIds: ["windows.minimum-distinct-cover"],
    prerequisites: ["windows.frequency-removal", "windows.variable-shrink"],
    checkpointIds: ["sliding-window-10"],
    nextIds: ["sliding-window-08"],
    objective:
      "Shrink every window that contains enough distinct values while preserving multiplicity counts.",
    rationale:
      "The same frequency state now helps find a minimum valid window.",
    statement:
      "Return the smallest length of a nonempty contiguous batch containing at least `k` different integer values. Return zero when no such batch exists. Repeated entries contribute one type regardless of frequency. k is always positive.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each integer is in [-1,000,000,1,000,000].",
      "1 ≤ k ≤ 2,000.",
    ],
    interface: "Solution.solve(values,k) returns an integer length or zero.",
    inputSchema: {
      kind: "object",
      properties: {
        values: arr,
        k: { kind: "integer", minimum: 1, maximum: 2000 },
      },
    },
    outputSchema: result,
    function: { arguments: vk, returnType: "int" },
    visible: [
      {
        input: { values: [1, 1, 2, 3], k: 3 },
        expected: 3,
        explanation: "The final [1,2,3] has all three required types.",
      },
      {
        input: { values: [], k: 1 },
        expected: 0,
        explanation: "No type can be found.",
      },
      {
        input: { values: [5, 5], k: 2 },
        expected: 0,
        explanation: "Only one different value exists.",
      },
    ],
    generate: () => varied(1),
    oracle: shortestVariety,
    independent: ({ values, k }) => {
      let best = Infinity;
      for (let i = 0; i < values.length; i++) {
        const s = new Set();
        for (let j = i; j < values.length; j++) {
          s.add(values[j]);
          if (s.size >= k) {
            best = Math.min(best, j - i + 1);
            break;
          }
        }
      }
      return Number.isFinite(best) ? best : 0;
    },
    mutations: {
      "always-return-k": ({ values, k }) => (new Set(values).size >= k ? k : 0),
      "first-qualifying-prefix": ({ values, k }) => {
        const s = new Set();
        for (let i = 0; i < values.length; i++) {
          s.add(values[i]);
          if (s.size >= k) return i + 1;
        }
        return 0;
      },
    },
    languages: langs(
      vk,
      "int",
      `HashMap<Integer,Integer> counts=new HashMap<>();int left=0,best=values.length+1;for(int right=0;right<values.length;right++){counts.put(values[right],counts.getOrDefault(values[right],0)+1);while(counts.size()>=k){best=Math.min(best,right-left+1);int old=values[left++],next=counts.get(old)-1;if(next==0)counts.remove(old);else counts.put(old,next);}}return best>values.length?0:best;`,
      `unordered_map<int,int> counts;int left=0,best=values.size()+1;for(int right=0;right<(int)values.size();right++){counts[values[right]]++;while((int)counts.size()>=k){best=min(best,right-left+1);int old=values[left++];if(--counts[old]==0)counts.erase(old);}}return best>(int)values.size()?0:best;`,
      `counts={}\nleft=0\nbest=len(values)+1\nfor right,value in enumerate(values):\n    counts[value]=counts.get(value,0)+1\n    while len(counts)>=k:\n        best=min(best,right-left+1)\n        old=values[left];left+=1\n        counts[old]-=1\n        if counts[old]==0:\n            del counts[old]\nreturn 0 if best>len(values) else best`,
    ),
  },
  {
    ...common,
    id: "sliding-window-12",
    slug: "longest-bounded-spread",
    title: "Longest batch with bounded spread",
    step: 5,
    skillIds: ["windows.dual-monotonic-deques"],
    prerequisites: ["windows.monotonic-deque"],
    checkpointIds: ["sliding-window-08"],
    objective:
      "Maintain both the maximum and minimum while shrinking a spread-constrained window.",
    rationale:
      "Keep two candidate sequences instead of one, so both ends of the value range remain available.",
    statement:
      "Return the greatest length of a contiguous batch for which its largest value minus its smallest value is at most `limit`. Single-value batches have spread zero. Negative values are allowed and compared normally. Empty input returns zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each integer is in [-1,000,000,1,000,000].",
      "0 ≤ limit ≤ 2,000,000.",
    ],
    interface: "Solution.solve(values,limit) returns an integer length.",
    inputSchema: {
      kind: "object",
      properties: {
        values: arr,
        limit: { kind: "integer", minimum: 0, maximum: 2000000 },
      },
    },
    outputSchema: result,
    function: { arguments: vl, returnType: "int" },
    visible: [
      {
        input: { values: [4, 1, 2, 3], limit: 2 },
        expected: 3,
        explanation: "[1,2,3] spans values from 1 through 3.",
      },
      {
        input: { values: [], limit: 0 },
        expected: 0,
        explanation: "There are no readings.",
      },
      {
        input: { values: [7, 7, 7], limit: 0 },
        expected: 3,
        explanation: "Equal values have zero spread regardless of length.",
      },
    ],
    generate: spreadInputs,
    oracle: spread,
    independent: ({ values, limit }) => {
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        let low = Infinity,
          high = -Infinity;
        for (let j = i; j < values.length; j++) {
          low = Math.min(low, values[j]);
          high = Math.max(high, values[j]);
          if (high - low <= limit) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    },
    mutations: {
      "adjacent-differences-only": ({ values, limit }) => {
        let best = values.length ? 1 : 0,
          start = 0;
        for (let i = 1; i < values.length; i++) {
          if (Math.abs(values[i] - values[i - 1]) > limit) start = i;
          best = Math.max(best, i - start + 1);
        }
        return best;
      },
      "strict-spread-boundary": ({ values, limit }) =>
        limit === 0 ? 0 : spread({ values, limit: limit - 1 }),
    },
    languages: langs(
      vl,
      "int",
      `ArrayDeque<Integer> hi=new ArrayDeque<>(),lo=new ArrayDeque<>();int left=0,best=0;for(int right=0;right<values.length;right++){while(!hi.isEmpty()&&values[hi.peekLast()]<=values[right])hi.removeLast();while(!lo.isEmpty()&&values[lo.peekLast()]>=values[right])lo.removeLast();hi.addLast(right);lo.addLast(right);while((long)values[hi.peekFirst()]-values[lo.peekFirst()]>limit){left++;if(hi.peekFirst()<left)hi.removeFirst();if(lo.peekFirst()<left)lo.removeFirst();}best=Math.max(best,right-left+1);}return best;`,
      `deque<int> hi,lo;int left=0,best=0;for(int right=0;right<(int)values.size();right++){while(!hi.empty()&&values[hi.back()]<=values[right])hi.pop_back();while(!lo.empty()&&values[lo.back()]>=values[right])lo.pop_back();hi.push_back(right);lo.push_back(right);while(1LL*values[hi.front()]-values[lo.front()]>limit){left++;if(hi.front()<left)hi.pop_front();if(lo.front()<left)lo.pop_front();}best=max(best,right-left+1);}return best;`,
      `from collections import deque\nhi=deque()\nlo=deque()\nleft=best=0\nfor right,value in enumerate(values):\n    while hi and values[hi[-1]]<=value:\n        hi.pop()\n    while lo and values[lo[-1]]>=value:\n        lo.pop()\n    hi.append(right);lo.append(right)\n    while values[hi[0]]-values[lo[0]]>limit:\n        left+=1\n        if hi[0]<left:\n            hi.popleft()\n        if lo[0]<left:\n            lo.popleft()\n    best=max(best,right-left+1)\nreturn best`,
    ),
  },
);
