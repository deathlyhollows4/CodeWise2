import { materializePack, seeded } from "./pack-builder.mjs";
const string = { kind: "string", ascii: true, maxLength: 10000 };
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const values = { kind: "array", maxLength: 2000, items: integer };
function texts() {
  const r = seeded(0x721),
    out = [];
  for (let i = 0; i < 650; i++) {
    const half = Array.from({ length: 1 + (r() % 15) }, () =>
      String.fromCharCode(97 + ((r() >>> 16) % 8)),
    ).join("");
    const text = i % 3 === 0 ? half + [...half].reverse().join("") : half;
    out.push({
      input: { text },
      category: i % 3 === 0 ? "mirrored-even" : "asymmetric-or-coincidental",
    });
  }
  out.push(
    { input: { text: "a".repeat(9999) + "b" }, category: "late-mismatch-long" },
    { input: { text: "aA" }, category: "case-sensitive-pair" },
    { input: { text: "abca" }, category: "inner-mismatch" },
  );
  return out;
}
function sortedArrays() {
  const r = seeded(0x725),
    out = [];
  for (let i = 0; i < 600; i++)
    out.push({
      input: {
        values: Array.from({ length: r() % 18 }, () => (r() % 31) - 15).sort(
          (a, b) => a - b,
        ),
      },
      category: "sorted-with-duplicates",
    });
  out.push({
    input: { values: Array.from({ length: 2000 }, (_, i) => i - 1000) },
    category: "all-distinct-large",
  });
  return out;
}
const common = {
  primaryTopic: "two-pointers",
  generatorModule: "content/authoring/two-pointers.mjs",
  prerequisites: ["arrays.traversal"],
  step: 1,
  checker: { kind: "exact" },
};
export const definitions = [
  {
    ...common,
    id: "two-pointers-01",
    slug: "reverse-letter-order",
    title: "Reverse letter order",
    skillIds: ["pointers.opposing", "strings.ascii-indexing"],
    objective: "Visit the two ends of a sequence and build its reversed order.",
    rationale:
      "You already visit an array in order. Now move two positions toward each other.",
    checkpointIds: ["two-pointers-02"],
    nextIds: ["two-pointers-03"],
    statement:
      "Return a string containing the ASCII letters of `text` in reverse order. Letter case matters and must be preserved. The empty string reverses to the empty string. This task is about positions, not sorting letters.\n\nFor example, reversing `cab` gives `bac` because the last character becomes the first.",
    constraints: [
      "0 ≤ text.length ≤ 10,000",
      "text contains only ASCII letters a–z and A–Z.",
    ],
    interface: "Solution.solve(text) returns a string.",
    inputSchema: { kind: "object", properties: { text: string } },
    outputSchema: string,
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "string",
    },
    valid: ({ text }) => /^[A-Za-z]*$/.test(text),
    visible: [
      {
        input: { text: "cab" },
        expected: "bac",
        explanation: "Read positions 2, 1, then 0.",
      },
      {
        input: { text: "" },
        expected: "",
        explanation: "There are no characters to move.",
      },
      {
        input: { text: "AaB" },
        expected: "BaA",
        explanation: "Case stays attached to each character.",
      },
    ],
    generate: texts,
    oracle: ({ text }) => [...text].reverse().join(""),
    independent: ({ text }) => {
      let result = "";
      for (let i = text.length - 1; i >= 0; i--) result += text[i];
      return result;
    },
    mutations: {
      "sort-instead-of-reverse": ({ text }) => [...text].sort().join(""),
      "omit-final-character": ({ text }) =>
        [...text].reverse().join("").slice(0, -1),
    },
    languages: {
      java: {
        starter:
          'class Solution { public String solve(String text) { return ""; } }',
        reference:
          "class Solution { public String solve(String text) { char[] out=text.toCharArray(); int left=0,right=out.length-1; while(left<right){char temp=out[left];out[left]=out[right];out[right]=temp;left++;right--;}return new String(out); } }",
      },
      cpp: {
        starter:
          'class Solution { public: string solve(string text){return "";} };',
        reference:
          "class Solution { public: string solve(string text){int left=0,right=(int)text.size()-1;while(left<right){swap(text[left],text[right]);left++;right--;}return text;} };",
      },
      python: {
        starter:
          'class Solution:\n    def solve(self, text):\n        return ""\n',
        reference:
          'class Solution:\n    def solve(self, text):\n        out=list(text)\n        left,right=0,len(out)-1\n        while left<right:\n            out[left],out[right]=out[right],out[left]\n            left+=1\n            right-=1\n        return "".join(out)\n',
      },
    },
  },
  {
    ...common,
    id: "two-pointers-02",
    slug: "mirror-letter-check",
    title: "Check a letter mirror",
    skillIds: ["pointers.symmetry-invariant"],
    objective:
      "Recognize symmetry by comparing opposite character pairs until a mismatch is found.",
    rationale:
      "Moving inward is familiar. Stop when a mismatched pair proves the answer false.",
    checkpointIds: ["two-pointers-01"],
    nextIds: ["two-pointers-03"],
    statement:
      "Return `true` when `text` reads identically from left to right and right to left. Compare every ASCII letter exactly; uppercase and lowercase are different. Empty and single-character strings count as mirrors. Do not ignore any characters.",
    constraints: [
      "0 ≤ text.length ≤ 10,000",
      "text contains only ASCII letters a–z and A–Z.",
    ],
    interface: "Solution.solve(text) returns a boolean.",
    inputSchema: { kind: "object", properties: { text: string } },
    outputSchema: { kind: "boolean" },
    function: {
      arguments: [{ name: "text", type: "string" }],
      returnType: "boolean",
    },
    valid: ({ text }) => /^[A-Za-z]*$/.test(text),
    visible: [
      {
        input: { text: "abccba" },
        expected: true,
        explanation: "Each opposing pair matches.",
      },
      {
        input: { text: "" },
        expected: true,
        explanation: "No opposing pair disagrees.",
      },
      {
        input: { text: "Aa" },
        expected: false,
        explanation: "Uppercase A and lowercase a are different.",
      },
    ],
    generate: texts,
    oracle: ({ text }) => text === [...text].reverse().join(""),
    independent: ({ text }) => {
      for (let i = 0; i < Math.floor(text.length / 2); i++)
        if (text[i] !== text[text.length - 1 - i]) return false;
      return true;
    },
    mutations: {
      "case-insensitive-comparison": ({ text }) =>
        text.toLowerCase() === [...text.toLowerCase()].reverse().join(""),
      "only-check-outer-pair": ({ text }) =>
        text.length < 2 || text[0] === text.at(-1),
    },
    languages: {
      java: {
        starter:
          "class Solution { public boolean solve(String text){return false;} }",
        reference:
          "class Solution { public boolean solve(String text){int left=0,right=text.length()-1;while(left<right){if(text.charAt(left)!=text.charAt(right))return false;left++;right--;}return true;} }",
      },
      cpp: {
        starter:
          "class Solution {public:bool solve(string text){return false;}};",
        reference:
          "class Solution {public:bool solve(string text){int left=0,right=(int)text.size()-1;while(left<right){if(text[left]!=text[right])return false;left++;right--;}return true;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, text):\n        return False\n",
        reference:
          "class Solution:\n    def solve(self, text):\n        left,right=0,len(text)-1\n        while left<right:\n            if text[left]!=text[right]:\n                return False\n            left+=1\n            right-=1\n        return True\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-03",
    slug: "move-zero-readings-to-end",
    title: "Move zero readings to the end",
    step: 2,
    skillIds: ["pointers.read-write", "arrays.stable-partition"],
    objective:
      "Move zeros behind nonzero readings while preserving the original nonzero order and every input entry.",
    rationale:
      "The pointers now have different jobs: one reads every value, while one marks the next nonzero output position.",
    checkpointIds: ["two-pointers-04"],
    remedialIds: ["two-pointers-01"],
    nextIds: ["two-pointers-05"],
    statement:
      "Return an array containing all nonzero readings from `values` in their original order, followed by all the zero readings. Keep every input entry, including repeated nonzero values. Do not sort the nonzero portion. The returned array must have the same length as the input; mutating the input is not required.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "Each integer lies in [-1,000,000, 1,000,000].",
      "Input order is arbitrary and repeated values must be preserved.",
    ],
    interface: "Solution.solve(values) returns an integer array.",
    inputSchema: { kind: "object", properties: { values } },
    outputSchema: values,
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "int[]",
    },
    visible: [
      {
        input: { values: [0, 4, -2, 0, 4] },
        expected: [4, -2, 4, 0, 0],
        explanation: "Keep 4, -2, 4 in that order and append both zeros.",
      },
      {
        input: { values: [] },
        expected: [],
        explanation: "No readings need to move.",
      },
      {
        input: { values: [0, 0, 0] },
        expected: [0, 0, 0],
        explanation: "All three zero readings stay in the output.",
      },
    ],
    generate: () => {
      const r = seeded(0x730);
      const out = [];
      for (let i = 0; i < 650; i++) {
        const input = {
          values: Array.from(
            { length: (r() >>> 16) % 24 },
            () => ((r() >>> 16) % 7) - 3,
          ),
        };
        out.push({ input, category: "stable-zero-partition" });
      }
      out.push({
        input: {
          values: Array.from({ length: 2000 }, (_, i) => (i % 3 ? i : 0)),
        },
        category: "long-scattered-zeros",
      });
      return out;
    },
    oracle: ({ values }) =>
      values.filter((v) => v !== 0).concat(values.filter((v) => v === 0)),
    independent: ({ values }) => {
      const out = Array(values.length).fill(0);
      let w = 0;
      for (const value of values) if (value !== 0) out[w++] = value;
      return out;
    },
    mutations: {
      "sort-nonzero-portion": ({ values }) =>
        values
          .filter((v) => v !== 0)
          .sort((a, b) => a - b)
          .concat(values.filter((v) => v === 0)),
      "discard-zero-entries": ({ values }) => values.filter((v) => v !== 0),
    },
    languages: {
      java: {
        starter:
          "class Solution {public int[] solve(int[] values){return new int[0];}}",
        reference:
          "class Solution {public int[] solve(int[] values){int[] result=new int[values.length];int write=0;for(int read=0;read<values.length;read++){if(values[read]!=0)result[write++]=values[read];}return result;}}",
      },
      cpp: {
        starter:
          "class Solution {public:vector<int> solve(vector<int> values){return {};}};",
        reference:
          "class Solution {public:vector<int> solve(vector<int> values){vector<int> result(values.size(),0);int write=0;for(int read=0;read<(int)values.size();read++){if(values[read]!=0)result[write++]=values[read];}return result;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values):\n        return []\n",
        reference:
          "class Solution:\n    def solve(self, values):\n        result=[0]*len(values)\n        write=0\n        for value in values:\n            if value!=0:\n                result[write]=value\n                write+=1\n        return result\n",
      },
    },
  },
];
const sorted = (a) => a.every((v, i) => i === 0 || v >= a[i - 1]);
function pairedArrays() {
  const r = seeded(0x726),
    out = [];
  for (let i = 0; i < 650; i++) {
    const left = Array.from(
      { length: (r() >>> 16) % 17 },
      () => ((r() >>> 16) % 41) - 20,
    ).sort((a, b) => a - b);
    const right = Array.from(
      { length: (r() >>> 16) % 17 },
      () => ((r() >>> 16) % 41) - 20,
    ).sort((a, b) => a - b);
    out.push({ input: { left, right }, category: "independent-sorted-runs" });
  }
  out.push({
    input: { left: [], right: Array.from({ length: 2000 }, (_, i) => i) },
    category: "one-empty-long-remainder",
  });
  out.push(
    { input: { left: Array.from({length:2000},(_,i)=>2*i-2000), right: Array.from({length:2000},(_,i)=>2*i-1999) }, category:"both-maximum-interleaved-4000-output" },
    { input: { left:Array(2000).fill(0),right:Array(2000).fill(0) }, category:"both-maximum-duplicate-multiplicity" },
    { input: { left:Array(2000).fill(-1000000),right:Array(2000).fill(1000000) }, category:"both-maximum-disjoint-boundary-runs" },
  );
  return out;
}
function targetPairs() {
  const r = seeded(0x727),
    out = [];
  for (let i = 0; i < 750; i++) {
    const values = Array.from(
      { length: (r() >>> 16) % 25 },
      () => ((r() >>> 16) % 31) - 15,
    ).sort((a, b) => a - b);
    out.push({
      input: { values, target: ((r() >>> 16) % 61) - 30 },
      category: "target-and-duplicate-runs",
    });
  }
  out.push({
    input: { values: Array(2000).fill(0), target: 0 },
    category: "large-equal-run",
  });
  return out;
}
const longArray = {
  kind: "array",
  maxLength: 4000,
  items: { kind: "safe-integer" },
};
function pairCount({ values, target }) {
  let left = 0,
    right = values.length - 1,
    count = 0;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum < target) left++;
    else if (sum > target) right--;
    else if (values[left] === values[right]) {
      const n = right - left + 1;
      count += (n * (n - 1)) / 2;
      break;
    } else {
      const a = values[left],
        b = values[right];
      let na = 0,
        nb = 0;
      while (left <= right && values[left] === a) {
        left++;
        na++;
      }
      while (right >= left && values[right] === b) {
        right--;
        nb++;
      }
      count += na * nb;
    }
  }
  return count;
}
definitions.push(
  {
    ...common,
    id: "two-pointers-04",
    slug: "merge-timeline-readings",
    title: "Merge two reading timelines",
    step: 2,
    skillIds: ["pointers.merge-cursors"],
    prerequisites: ["sorted.order"],
    checkpointIds: ["two-pointers-03"],
    nextIds: ["two-pointers-05"],
    objective:
      "Advance the cursor pointing to the smaller next value and retain all remaining values.",
    rationale:
      "Each cursor now tracks a different sorted input. Only one needs to advance at each step.",
    statement:
      "Arrays `left` and `right` are both sorted in nondecreasing order. Return one sorted array containing every entry from both inputs. Keep duplicate entries, including equal values that occur in different inputs. Either input may be empty. You may modify the local decoded input arrays; only the returned merged result is graded.",
    constraints: [
      "Each input contains 0..2,000 integers in [-1,000,000,1,000,000].",
      "Both inputs are already sorted.",
      "The output contains left.length + right.length entries.",
    ],
    interface: "Solution.solve(left,right) returns an integer array.",
    inputSchema: {
      kind: "object",
      properties: { left: values, right: values },
    },
    outputSchema: { ...values, maxLength: 4000 },
    valid: ({ left, right }) => sorted(left) && sorted(right),
    function: {
      arguments: [
        { name: "left", type: "int[]" },
        { name: "right", type: "int[]" },
      ],
      returnType: "int[]",
    },
    visible: [
      {
        input: { left: [1, 4, 8], right: [2, 4, 7] },
        expected: [1, 2, 4, 4, 7, 8],
        explanation: "Each 4 is retained as a separate entry.",
      },
      {
        input: { left: [], right: [] },
        expected: [],
        explanation: "There are no readings in either timeline.",
      },
      {
        input: { left: [], right: [-3, -3, 5] },
        expected: [-3, -3, 5],
        explanation: "Copy the entire nonempty remainder.",
      },
    ],
    generate: pairedArrays,
    oracle: ({ left, right }) => [...left, ...right].sort((a, b) => a - b),
    independent: ({ left, right }) => {
      const frequency = new Map();
      for (const x of left.concat(right))
        frequency.set(x, (frequency.get(x) || 0) + 1);
      return [...frequency.keys()]
        .sort((a, b) => a - b)
        .flatMap((x) => Array(frequency.get(x)).fill(x));
    },
    mutations: {
      "deduplicate-inputs": ({ left, right }) =>
        [...new Set(left.concat(right))].sort((a, b) => a - b),
      "drop-remainder": ({ left, right }) => {
        let i = 0,
          j = 0,
          out = [];
        while (i < left.length && j < right.length)
          out.push(left[i] <= right[j] ? left[i++] : right[j++]);
        return out;
      },
    },
    languages: {
      java: {
        starter:
          "class Solution {public int[] solve(int[] left,int[] right){return new int[0];}}",
        reference:
          "class Solution {public int[] solve(int[] left,int[] right){int[] out=new int[left.length+right.length];int i=0,j=0,k=0;while(i<left.length&&j<right.length)out[k++]=left[i]<=right[j]?left[i++]:right[j++];while(i<left.length)out[k++]=left[i++];while(j<right.length)out[k++]=right[j++];return out;}}",
      },
      cpp: {
        starter:
          "class Solution {public:vector<int> solve(vector<int> left,vector<int> right){return {};}};",
        reference:
          "class Solution {public:vector<int> solve(vector<int> left,vector<int> right){vector<int> out;int i=0,j=0;while(i<(int)left.size()&&j<(int)right.size())out.push_back(left[i]<=right[j]?left[i++]:right[j++]);while(i<(int)left.size())out.push_back(left[i++]);while(j<(int)right.size())out.push_back(right[j++]);return out;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, left, right):\n        return []\n",
        reference:
          "class Solution:\n    def solve(self, left, right):\n        out=[]\n        i=j=0\n        while i<len(left) and j<len(right):\n            if left[i]<=right[j]:\n                out.append(left[i]); i+=1\n            else:\n                out.append(right[j]); j+=1\n        out.extend(left[i:])\n        out.extend(right[j:])\n        return out\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-05",
    slug: "sorted-squared-readings",
    title: "Keep squared readings sorted",
    step: 3,
    skillIds: ["pointers.compare-absolute-ends", "sorted.output-backwards"],
    prerequisites: ["pointers.opposing", "sorted.order"],
    checkpointIds: ["two-pointers-06"],
    nextIds: ["two-pointers-07"],
    objective:
      "Place the largest remaining square at the end while comparing opposing absolute magnitudes.",
    rationale:
      "Negative readings change order when squared; compare both ends rather than trusting the original order.",
    statement:
      "The integer array `values` is sorted in nondecreasing order. Return the square of every input value, sorted in nondecreasing order. Preserve duplicate squares. Use 64-bit integer values for the output in Java and C++, since a square can exceed a 32-bit integer.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "-1,000,000 ≤ values[i] ≤ 1,000,000",
      "Input is already sorted; squares are at most 1,000,000,000,000.",
    ],
    interface:
      "Solution.solve(values) returns a long integer array (ordinary Python integer list).",
    inputSchema: { kind: "object", properties: { values } },
    outputSchema: longArray,
    valid: ({ values }) => sorted(values),
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "long[]",
    },
    visible: [
      {
        input: { values: [-4, -1, 0, 3] },
        expected: [0, 1, 9, 16],
        explanation:
          "The negative value with largest magnitude contributes the largest square.",
      },
      {
        input: { values: [] },
        expected: [],
        explanation: "No readings produce no squares.",
      },
      {
        input: { values: [-1000000, 1000000] },
        expected: [1000000000000, 1000000000000],
        explanation: "Use a wide integer and keep both equal squares.",
      },
    ],
    generate: () =>
      sortedArrays().concat([
        {
          input: { values: [-1000000, -999999, 0, 999999, 1000000] },
          category: "wide-integer-squares",
        },
      ]),
    oracle: ({ values }) => values.map((v) => v * v).sort((a, b) => a - b),
    independent: ({ values }) => {
      const out = [];
      for (const v of values) {
        const sq = v * v;
        let i = 0;
        while (i < out.length && out[i] <= sq) i++;
        out.splice(i, 0, sq);
      }
      return out;
    },
    mutations: {
      "keep-input-order": ({ values }) => values.map((v) => v * v),
      "32-bit-multiplication": ({ values }) =>
        values.map((v) => Math.imul(v, v)).sort((a, b) => a - b),
    },
    languages: {
      java: {
        starter:
          "class Solution {public long[] solve(int[] values){return new long[0];}}",
        reference:
          "class Solution {public long[] solve(int[] values){long[] out=new long[values.length];int l=0,r=values.length-1;for(int w=values.length-1;w>=0;w--){long a=(long)values[l]*values[l],b=(long)values[r]*values[r];if(a>b){out[w]=a;l++;}else{out[w]=b;r--;}}return out;}}",
      },
      cpp: {
        starter:
          "class Solution {public:vector<long long> solve(vector<int> values){return {};}};",
        reference:
          "class Solution {public:vector<long long> solve(vector<int> values){vector<long long> out(values.size());int l=0,r=(int)values.size()-1;for(int w=r;w>=0;w--){long long a=1LL*values[l]*values[l],b=1LL*values[r]*values[r];if(a>b){out[w]=a;l++;}else{out[w]=b;r--;}}return out;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values):\n        return []\n",
        reference:
          "class Solution:\n    def solve(self, values):\n        out=[0]*len(values)\n        left,right=0,len(values)-1\n        for write in range(len(values)-1,-1,-1):\n            a,b=values[left]**2,values[right]**2\n            if a>b:\n                out[write]=a; left+=1\n            else:\n                out[write]=b; right-=1\n        return out\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-06",
    slug: "count-target-pairs",
    title: "Count matching position pairs",
    step: 3,
    skillIds: ["pointers.target-sum", "pointers.equal-run-products"],
    prerequisites: ["pointers.opposing", "sorted.order"],
    checkpointIds: ["two-pointers-05"],
    nextIds: ["two-pointers-07"],
    objective:
      "Count every matching pair of distinct positions, including multiplicities in equal-value runs.",
    rationale:
      "Finding a matching pair is not enough: duplicate runs can represent many different position pairs.",
    statement:
      "Given sorted `values` and integer `target`, return the number of index pairs `(i,j)` for which `i < j` and `values[i] + values[j] == target`. Count positions, not merely different value pairs. Never use a position twice. An empty array or a single value has zero pairs.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "values is sorted, with integers in [-1,000,000,1,000,000].",
      "target is in [-2,000,000,2,000,000].",
    ],
    interface: "Solution.solve(values,target) returns a 64-bit integer count.",
    inputSchema: {
      kind: "object",
      properties: {
        values,
        target: { kind: "integer", minimum: -2000000, maximum: 2000000 },
      },
    },
    outputSchema: { kind: "safe-integer" },
    valid: ({ values }) => sorted(values),
    function: {
      arguments: [
        { name: "values", type: "int[]" },
        { name: "target", type: "long" },
      ],
      returnType: "long",
    },
    visible: [
      {
        input: { values: [1, 1, 3, 3], target: 4 },
        expected: 4,
        explanation:
          "Each of the two 1 positions can pair with each of the two 3 positions.",
      },
      {
        input: { values: [], target: 0 },
        expected: 0,
        explanation: "No positions exist.",
      },
      {
        input: { values: [2, 2, 2], target: 4 },
        expected: 3,
        explanation:
          "Choose two different positions from three: (0,1), (0,2), and (1,2).",
      },
    ],
    generate: targetPairs,
    oracle: pairCount,
    independent: ({ values, target }) => {
      let count = 0;
      for (let i = 0; i < values.length; i++)
        for (let j = i + 1; j < values.length; j++)
          if (values[i] + values[j] === target) count++;
      return count;
    },
    mutations: {
      "count-only-value-pairs": ({ values, target }) => {
        const unique = [...new Set(values)];
        let count = 0;
        for (let i = 0; i < unique.length; i++)
          for (let j = i; j < unique.length; j++)
            if (unique[i] + unique[j] === target) count++;
        return count;
      },
      "reuse-same-position": (input) =>
        pairCount(input) +
        input.values.filter((v) => 2 * v === input.target).length,
    },
    languages: {
      java: {
        starter:
          "class Solution {public long solve(int[] values,long target){return 0L;}}",
        reference:
          "class Solution {public long solve(int[] values,long target){int l=0,r=values.length-1;long count=0;while(l<r){long sum=(long)values[l]+values[r];if(sum<target)l++;else if(sum>target)r--;else if(values[l]==values[r]){long n=r-l+1;count+=n*(n-1)/2;break;}else{int a=values[l],b=values[r];long na=0,nb=0;while(l<=r&&values[l]==a){na++;l++;}while(r>=l&&values[r]==b){nb++;r--;}count+=na*nb;}}return count;}}",
      },
      cpp: {
        starter:
          "class Solution {public:long long solve(vector<int> values,long long target){return 0;}};",
        reference:
          "class Solution {public:long long solve(vector<int> values,long long target){int l=0,r=(int)values.size()-1;long long count=0;while(l<r){long long sum=1LL*values[l]+values[r];if(sum<target)l++;else if(sum>target)r--;else if(values[l]==values[r]){long long n=r-l+1;count+=n*(n-1)/2;break;}else{int a=values[l],b=values[r];long long na=0,nb=0;while(l<=r&&values[l]==a){na++;l++;}while(r>=l&&values[r]==b){nb++;r--;}count+=na*nb;}}return count;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values, target):\n        return 0\n",
        reference:
          "class Solution:\n    def solve(self, values, target):\n        left,right,count=0,len(values)-1,0\n        while left<right:\n            total=values[left]+values[right]\n            if total<target:\n                left+=1\n            elif total>target:\n                right-=1\n            elif values[left]==values[right]:\n                n=right-left+1\n                count+=n*(n-1)//2\n                break\n            else:\n                a,b=values[left],values[right]\n                na=nb=0\n                while left<=right and values[left]==a:\n                    left+=1;na+=1\n                while right>=left and values[right]==b:\n                    right-=1;nb+=1\n                count+=na*nb\n        return count\n",
      },
    },
  },
);
function tripleScan({ values, target }) {
  const a = [...values].sort((x, y) => x - y),
    out = [];
  for (let i = 0; i < a.length - 2; i++) {
    if (i && a[i] === a[i - 1]) continue;
    let l = i + 1,
      r = a.length - 1;
    while (l < r) {
      const sum = a[i] + a[l] + a[r];
      if (sum < target) l++;
      else if (sum > target) r--;
      else {
        out.push([a[i], a[l], a[r]]);
        const x = a[l],
          y = a[r];
        while (l < r && a[l] === x) l++;
        while (l < r && a[r] === y) r--;
      }
    }
  }
  return out;
}
function triples() {
  const r = seeded(0x737);
  const out = Array.from({ length: 700 }, () => ({
    input: {
      values: Array.from(
        { length: (r() >>> 16) % 19 },
        () => ((r() >>> 16) % 21) - 10,
      ),
      target: ((r() >>> 16) % 25) - 12,
    },
    category: "duplicate-triplet-combinations",
  }));
  for(const input of [
    {values:Array.from({length:80},(_,i)=>i-40),target:0},
    {values:Array(80).fill(1000000),target:3000000},
    {values:[...Array(40).fill(-1000000),...Array(40).fill(1000000)],target:1000000},
    {values:Array(80).fill(0),target:0},
    {values:Array(80).fill(0),target:1},
    {values:[-1000000,1000000,...Array(78).fill(0)],target:0},
  ])out.push({input,category:"maximum-80-position-multiplicity-and-distinct-triplets"});
  return out;
}
function heights() {
  const r = seeded(0x738),
    out = [];
  for (let i = 0; i < 700; i++)
    out.push({
      input: {
        values: Array.from(
          { length: (r() >>> 16) % 27 },
          () => (r() >>> 16) % 31,
        ),
      },
      category: "varying-wall-heights",
    });
  out.push({
    input: { values: Array(2000).fill(1000000) },
    category: "large-wide-product",
  });
  return out;
}
function container({ values }) {
  let l = 0,
    r = values.length - 1,
    best = 0;
  while (l < r) {
    best = Math.max(best, (r - l) * Math.min(values[l], values[r]));
    if (values[l] <= values[r]) l++;
    else r--;
  }
  return best;
}
function removals() {
  const r = seeded(0x739),
    out = [];
  for (let i = 0; i < 700; i++) {
    const values = Array.from(
      { length: (r() >>> 16) % 24 },
      () => (r() >>> 16) % 11,
    );
    const total = values.reduce((s, v) => s + v, 0);
    out.push({
      input: { values, target: (r() >>> 16) % (total + 3) },
      category: "end-removal-target",
    });
  }
  out.push({
    input: { values: Array(2000).fill(1000000), target: 1000000000 },
    category: "long-half-removal",
  });
  return out;
}
function minRemovals({ values, target }) {
  const keep = values.reduce((s, v) => s + v, 0) - target;
  if (keep < 0) return -1;
  let left = 0,
    sum = 0,
    best = keep === 0 ? 0 : -1;
  for (let right = 0; right < values.length; right++) {
    sum += values[right];
    while (left <= right && sum > keep) sum -= values[left++];
    if (sum === keep) best = Math.max(best, right - left + 1);
  }
  return best < 0 ? -1 : values.length - best;
}
function canonical(symbols, counts) {
  const out = [];
  for (let i = 0; i < symbols.length; i++) {
    if (out.length && out.at(-1)[0] === symbols[i]) out.at(-1)[1] += counts[i];
    else out.push([symbols[i], counts[i]]);
  }
  return out;
}
function runCases() {
  const r = seeded(0x73a),
    out = [];
  for (let i = 0; i < 700; i++) {
    const length = 1 + ((r() >>> 16) % 12);
    let symbolsA = "",
      symbolsB = "";
    const countsA = [],
      countsB = [];
    for (let j = 0; j < length; j++) {
      const c = String.fromCharCode(97 + ((r() >>> 16) % 5)),
        n = 2 + ((r() >>> 16) % 30);
      symbolsA += c;
      countsA.push(n);
      if (i % 2 === 0) {
        symbolsB += c + c;
        countsB.push(1, n - 1);
      } else {
        symbolsB += String.fromCharCode(97 + ((r() >>> 16) % 5));
        countsB.push(1 + ((r() >>> 16) % 30));
      }
    }
    out.push({
      input: { symbolsA, countsA, symbolsB, countsB },
      category: i % 2 ? "different-compressed-texts" : "equivalent-split-runs",
    });
  }
  out.push({
    input: {
      symbolsA: "aa",
      countsA: [1000000000, 1000000000],
      symbolsB: "aa",
      countsB: [999999999, 1000000000],
    },
    category: "wide-run-length-mismatch",
  });
  const hundred="ab".repeat(50), hundredCounts=Array(100).fill(1000000000);
  out.push(
    {input:{symbolsA:hundred,countsA:hundredCounts,symbolsB:hundred,countsB:[...hundredCounts]},category:"both-maximum-100-runs-wide-equal"},
    {input:{symbolsA:hundred,countsA:hundredCounts,symbolsB:hundred.slice(0,-1)+"c",countsB:[...hundredCounts]},category:"both-maximum-100-runs-final-symbol-mismatch"},
    {input:{symbolsA:hundred,countsA:hundredCounts,symbolsB:hundred,countsB:[...hundredCounts.slice(0,-1),999999999]},category:"both-maximum-100-runs-final-residual"},
    {input:{symbolsA:"a".repeat(100),countsA:Array(100).fill(999999999),symbolsB:"a".repeat(100),countsB:Array.from({length:100},(_,i)=>i%2?999999998:1000000000)},category:"maximum-adjacent-wide-run-redistribution-equal"},
    {input:{symbolsA:"ab".repeat(25),countsA:Array(50).fill(1000000000),symbolsB:[..."ab".repeat(25)].map(c=>c+c).join(""),countsB:Array.from({length:100},(_,i)=>i%2?999999999:1)},category:"maximum-100-runs-equivalent-split-wide-residual"},
  );
  return out;
}
definitions.push(
  {
    ...common,
    id: "two-pointers-07",
    slug: "unique-value-triples",
    title: "Unique triples for a target",
    step: 4,
    skillIds: ["pointers.anchored-pair-search", "sorted.duplicate-skips"],
    prerequisites: ["pointers.target-sum", "sorted.order"],
    checkpointIds: ["two-pointers-08"],
    remedialIds: ["two-pointers-06"],
    nextIds: ["two-pointers-09"],
    objective:
      "Anchor one value and search opposing pairs while reporting each value triple once.",
    rationale:
      "A third value adds one outer choice; reuse the familiar pair scan inside that choice.",
    statement:
      "Return every different value triple `[a,b,c]` that can be selected from three distinct input positions and sums to `target`. Each triple must satisfy `a ≤ b ≤ c`. Return triples in ascending lexicographic numeric order: compare a first, then b, then c. A triple appears once even if many position combinations produce it. Repeated values inside a triple are allowed only when enough input positions contain them.",
    constraints: [
      "0 ≤ values.length ≤ 80",
      "Each value is in [-1,000,000,1,000,000].",
      "target is in [-3,000,000,3,000,000].",
    ],
    interface: "Solution.solve(values,target) returns a nested integer array.",
    inputSchema: {
      kind: "object",
      properties: {
        values: { ...values, maxLength: 80, unordered:true },
        target: { kind: "integer", minimum: -3000000, maximum: 3000000 },
      },
    },
    outputSchema: {
      kind: "array",
      maxLength: 4000,
      items: { ...values, minLength: 3, maxLength: 3 },
    },
    function: {
      arguments: [
        { name: "values", type: "int[]" },
        { name: "target", type: "long" },
      ],
      returnType: "int[][]",
    },
    visible: [
      {
        input: { values: [-2, 0, 1, 1, 2], target: 0 },
        expected: [
          [-2, 0, 2],
          [-2, 1, 1],
        ],
        explanation: "The two 1 positions permit the repeated-value triple.",
      },
      {
        input: { values: [1, 2], target: 3 },
        expected: [],
        explanation: "Three distinct positions are required.",
      },
      {
        input: { values: [0, 0, 0, 0], target: 0 },
        expected: [[0, 0, 0]],
        explanation: "Several index choices still represent one value triple.",
      },
    ],
    generate: triples,
    oracle: tripleScan,
    independent: ({ values, target }) => {
      const set = new Map();
      for (let i = 0; i < values.length; i++)
        for (let j = i + 1; j < values.length; j++)
          for (let k = j + 1; k < values.length; k++)
            if (values[i] + values[j] + values[k] === target) {
              const triple = [values[i], values[j], values[k]].sort(
                (a, b) => a - b,
              );
              set.set(triple.join(","), triple);
            }
      return [...set.values()].sort(
        (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2],
      );
    },
    mutations: {
      "erase-repeated-input-values": ({ values, target }) =>
        tripleScan({ values: [...new Set(values)], target }),
      "duplicate-triple-output": (input) =>
        tripleScan(input).flatMap((t) => [t, t]),
    },
    languages: {
      java: {
        starter:
          "class Solution {public int[][] solve(int[] values,long target){return new int[0][];}}",
        reference:
          "class Solution {public int[][] solve(int[] values,long target){int[] a=values.clone();Arrays.sort(a);ArrayList<int[]> out=new ArrayList<>();for(int i=0;i<a.length-2;i++){if(i>0&&a[i]==a[i-1])continue;int l=i+1,r=a.length-1;while(l<r){long sum=(long)a[i]+a[l]+a[r];if(sum<target)l++;else if(sum>target)r--;else{out.add(new int[]{a[i],a[l],a[r]});int x=a[l],y=a[r];while(l<r&&a[l]==x)l++;while(l<r&&a[r]==y)r--;}}}return out.toArray(new int[0][]);}}",
      },
      cpp: {
        starter:
          "class Solution {public:vector<vector<int>> solve(vector<int> values,long long target){return {};}};",
        reference:
          "class Solution {public:vector<vector<int>> solve(vector<int> values,long long target){sort(values.begin(),values.end());vector<vector<int>> out;for(int i=0;i<(int)values.size()-2;i++){if(i&&values[i]==values[i-1])continue;int l=i+1,r=(int)values.size()-1;while(l<r){long long sum=1LL*values[i]+values[l]+values[r];if(sum<target)l++;else if(sum>target)r--;else{out.push_back({values[i],values[l],values[r]});int x=values[l],y=values[r];while(l<r&&values[l]==x)l++;while(l<r&&values[r]==y)r--;}}}return out;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values, target):\n        return []\n",
        reference:
          "class Solution:\n    def solve(self, values, target):\n        a=sorted(values)\n        out=[]\n        for i in range(len(a)-2):\n            if i and a[i]==a[i-1]:\n                continue\n            left,right=i+1,len(a)-1\n            while left<right:\n                total=a[i]+a[left]+a[right]\n                if total<target:\n                    left+=1\n                elif total>target:\n                    right-=1\n                else:\n                    out.append([a[i],a[left],a[right]])\n                    x,y=a[left],a[right]\n                    while left<right and a[left]==x:\n                        left+=1\n                    while left<right and a[right]==y:\n                        right-=1\n        return out\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-08",
    slug: "largest-wall-span",
    title: "Largest wall span",
    step: 4,
    skillIds: ["pointers.eliminate-shorter-boundary"],
    prerequisites: ["pointers.opposing"],
    checkpointIds: ["two-pointers-07"],
    nextIds: ["two-pointers-09"],
    objective:
      "Justify eliminating the shorter boundary while optimizing height times distance.",
    rationale:
      "Moving a pointer is now a choice that must preserve the possibility of a better answer.",
    statement:
      "At each integer position i stands a wall of height `values[i]`. Choosing two positions i<j gives capacity `(j-i) * min(values[i],values[j])`. Return the largest capacity among all pairs. Walls have zero thickness; the distance is the difference of indices. With fewer than two walls, return zero.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "0 ≤ each height ≤ 1,000,000.",
      "Use a 64-bit integer for capacity.",
    ],
    interface: "Solution.solve(values) returns a 64-bit capacity.",
    inputSchema: {
      kind: "object",
      properties: {
        values: {
          ...values,
          items: { kind: "integer", minimum: 0, maximum: 1000000 },
        },
      },
    },
    outputSchema: { kind: "safe-integer" },
    function: {
      arguments: [{ name: "values", type: "int[]" }],
      returnType: "long",
    },
    visible: [
      {
        input: { values: [3, 1, 4, 2] },
        expected: 6,
        explanation:
          "Positions 0 and 3 give distance 3 times shorter height 2.",
      },
      {
        input: { values: [7] },
        expected: 0,
        explanation: "A pair requires two positions.",
      },
      {
        input: { values: [5, 0, 0, 5] },
        expected: 15,
        explanation: "Interior heights do not limit the chosen boundary pair.",
      },
    ],
    generate: heights,
    oracle: container,
    independent: ({ values }) => {
      let best = 0;
      for (let i = 0; i < values.length; i++)
        for (let j = i + 1; j < values.length; j++)
          best = Math.max(best, (j - i) * Math.min(values[i], values[j]));
      return best;
    },
    mutations: {
      "use-taller-boundary": ({ values }) => {
        let best = 0;
        for (let i = 0; i < values.length; i++)
          for (let j = i + 1; j < values.length; j++)
            best = Math.max(best, (j - i) * Math.max(values[i], values[j]));
        return best;
      },
      "adjacent-only": ({ values }) => {
        let best = 0;
        for (let i = 1; i < values.length; i++)
          best = Math.max(best, Math.min(values[i - 1], values[i]));
        return best;
      },
    },
    languages: {
      java: {
        starter: "class Solution {public long solve(int[] values){return 0L;}}",
        reference:
          "class Solution {public long solve(int[] values){int l=0,r=values.length-1;long best=0;while(l<r){best=Math.max(best,(long)(r-l)*Math.min(values[l],values[r]));if(values[l]<=values[r])l++;else r--;}return best;}}",
      },
      cpp: {
        starter:
          "class Solution {public:long long solve(vector<int> values){return 0;}};",
        reference:
          "class Solution {public:long long solve(vector<int> values){int l=0,r=(int)values.size()-1;long long best=0;while(l<r){best=max(best,1LL*(r-l)*min(values[l],values[r]));if(values[l]<=values[r])l++;else r--;}return best;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values):\n        return 0\n",
        reference:
          "class Solution:\n    def solve(self, values):\n        left,right,best=0,len(values)-1,0\n        while left<right:\n            best=max(best,(right-left)*min(values[left],values[right]))\n            if values[left]<=values[right]:\n                left+=1\n            else:\n                right-=1\n        return best\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-09",
    slug: "remove-target-from-ends",
    title: "Remove a target from the ends",
    step: 5,
    skillIds: ["pointers.kept-middle-invariant"],
    prerequisites: ["windows.fixed-boundaries", "arrays.traversal"],
    checkpointIds: ["two-pointers-10"],
    remedialIds: ["sliding-window-01"],
    objective:
      "Transform endpoint removal into the longest contiguous middle with a complementary sum.",
    rationale:
      "Two moving boundaries describe the portion you keep, letting you minimize removals.",
    statement:
      "You may repeatedly remove the first or last remaining entry from the nonnegative array `values`. Return the minimum number of removed entries whose total equals `target`. Return -1 if impossible. Removing nothing is allowed and totals zero. An entry cannot be removed twice, and removals from opposite ends cannot overlap.",
    constraints: [
      "0 ≤ values.length ≤ 2,000",
      "0 ≤ values[i] ≤ 1,000,000.",
      "0 ≤ target ≤ 2,000,000,000.",
    ],
    interface: "Solution.solve(values,target) returns an integer count or -1.",
    inputSchema: {
      kind: "object",
      properties: {
        values: {
          ...values,
          items: { kind: "integer", minimum: 0, maximum: 1000000 },
        },
        target: { kind: "integer", minimum: 0, maximum: 2000000000 },
      },
    },
    outputSchema: { kind: "integer", minimum: -1, maximum: 2000 },
    function: {
      arguments: [
        { name: "values", type: "int[]" },
        { name: "target", type: "long" },
      ],
      returnType: "int",
    },
    visible: [
      {
        input: { values: [2, 1, 4, 1, 3], target: 5 },
        expected: 2,
        explanation: "Remove the left 2 and right 3.",
      },
      {
        input: { values: [], target: 0 },
        expected: 0,
        explanation: "No removal is necessary.",
      },
      {
        input: { values: [0, 2, 0], target: 2 },
        expected: 2,
        explanation:
          "Remove a boundary zero and the 2; leaving the other zero uses fewer removals than deleting all entries.",
      },
    ],
    generate: removals,
    oracle: minRemovals,
    independent: ({ values, target }) => {
      const prefix = [0],
        suffix = [0];
      for (const x of values) prefix.push(prefix.at(-1) + x);
      for (let i = values.length - 1; i >= 0; i--)
        suffix.push(suffix.at(-1) + values[i]);
      let best = Infinity;
      for (let a = 0; a <= values.length; a++)
        for (let b = 0; a + b <= values.length; b++)
          if (prefix[a] + suffix[b] === target) best = Math.min(best, a + b);
      return Number.isFinite(best) ? best : -1;
    },
    mutations: {
      "only-remove-left": ({ values, target }) => {
        let total = 0;
        if (!target) return 0;
        for (let i = 0; i < values.length; i++) {
          total += values[i];
          if (total === target) return i + 1;
        }
        return -1;
      },
      "overlap-end-removals": ({ values, target }) => {
        const left = [0],
          right = [0];
        for (const x of values) left.push(left.at(-1) + x);
        for (const x of [...values].reverse()) right.push(right.at(-1) + x);
        let best = Infinity;
        for (let a = 0; a < left.length; a++)
          for (let b = 0; b < right.length; b++)
            if (left[a] + right[b] === target) best = Math.min(best, a + b);
        return Number.isFinite(best) ? best : -1;
      },
    },
    languages: {
      java: {
        starter:
          "class Solution {public int solve(int[] values,long target){return -1;}}",
        reference:
          "class Solution {public int solve(int[] values,long target){long keep=-target;for(int x:values)keep+=x;if(keep<0)return -1;int l=0,best=keep==0?0:-1;long sum=0;for(int r=0;r<values.length;r++){sum+=values[r];while(l<=r&&sum>keep)sum-=values[l++];if(sum==keep)best=Math.max(best,r-l+1);}return best<0?-1:values.length-best;}}",
      },
      cpp: {
        starter:
          "class Solution {public:int solve(vector<int> values,long long target){return -1;}};",
        reference:
          "class Solution {public:int solve(vector<int> values,long long target){long long keep=-target;for(int x:values)keep+=x;if(keep<0)return -1;int l=0,best=keep==0?0:-1;long long sum=0;for(int r=0;r<(int)values.size();r++){sum+=values[r];while(l<=r&&sum>keep)sum-=values[l++];if(sum==keep)best=max(best,r-l+1);}return best<0?-1:(int)values.size()-best;}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, values, target):\n        return -1\n",
        reference:
          "class Solution:\n    def solve(self, values, target):\n        keep=sum(values)-target\n        if keep<0:\n            return -1\n        left,total,best=0,0,(0 if keep==0 else -1)\n        for right,value in enumerate(values):\n            total+=value\n            while left<=right and total>keep:\n                total-=values[left];left+=1\n            if total==keep:\n                best=max(best,right-left+1)\n        return -1 if best<0 else len(values)-best\n",
      },
    },
  },
  {
    ...common,
    id: "two-pointers-10",
    slug: "compare-compressed-letter-runs",
    title: "Compare compressed letter runs",
    step: 5,
    skillIds: ["pointers.residual-run-lengths"],
    prerequisites: ["pointers.merge-cursors"],
    checkpointIds: ["two-pointers-09"],
    objective:
      "Compare two compressed sequences by consuming the smaller remaining run without expanding large counts.",
    rationale:
      "The cursors can move by a whole shared run length rather than one character at a time.",
    statement:
      "A compressed text is described by a letter string and an equally long count array. Position i represents counts[i] copies of symbols[i]. Given two compressed texts, return whether their expanded texts would be identical. Adjacent runs may use the same letter; they still belong to the same expanded text. Counts can be very large, so do not create the expanded strings. Empty descriptions represent empty text.",
    constraints: [
      "0 ≤ each symbols string length ≤ 100",
      "symbols contain lowercase ASCII letters a..z.",
      "Each counts array length equals its symbols string length.",
      "1 ≤ each count ≤ 1,000,000,000.",
    ],
    interface:
      "Solution.solve(symbolsA,countsA,symbolsB,countsB) returns a boolean.",
    inputSchema: {
      kind: "object",
      properties: {
        symbolsA: { kind: "string", ascii: true, maxLength: 100 },
        countsA: {
          kind: "array",
          maxLength: 100,
          items: { kind: "integer", minimum: 1, maximum: 1000000000 },
        },
        symbolsB: { kind: "string", ascii: true, maxLength: 100 },
        countsB: {
          kind: "array",
          maxLength: 100,
          items: { kind: "integer", minimum: 1, maximum: 1000000000 },
        },
      },
    },
    outputSchema: { kind: "boolean" },
    valid: ({ symbolsA, countsA, symbolsB, countsB }) =>
      /^[a-z]*$/.test(symbolsA) &&
      /^[a-z]*$/.test(symbolsB) &&
      symbolsA.length === countsA.length &&
      symbolsB.length === countsB.length,
    function: {
      arguments: [
        { name: "symbolsA", type: "string" },
        { name: "countsA", type: "int[]" },
        { name: "symbolsB", type: "string" },
        { name: "countsB", type: "int[]" },
      ],
      returnType: "boolean",
    },
    visible: [
      {
        input: {
          symbolsA: "aab",
          countsA: [2, 3, 1],
          symbolsB: "ab",
          countsB: [5, 1],
        },
        expected: true,
        explanation: "Both expand to five a letters followed by one b.",
      },
      {
        input: { symbolsA: "", countsA: [], symbolsB: "", countsB: [] },
        expected: true,
        explanation: "Both descriptions are empty.",
      },
      {
        input: {
          symbolsA: "a",
          countsA: [1000000000],
          symbolsB: "a",
          countsB: [999999999],
        },
        expected: false,
        explanation:
          "The final unmatched a matters even though the runs are large.",
      },
    ],
    generate: runCases,
    oracle: ({ symbolsA, countsA, symbolsB, countsB }) =>
      JSON.stringify(canonical(symbolsA, countsA)) ===
      JSON.stringify(canonical(symbolsB, countsB)),
    independent: ({ symbolsA, countsA, symbolsB, countsB }) => {
      let i = 0,
        j = 0,
        a = countsA[0] || 0,
        b = countsB[0] || 0;
      while (i < symbolsA.length && j < symbolsB.length) {
        if (symbolsA[i] !== symbolsB[j]) return false;
        const step = Math.min(a, b);
        a -= step;
        b -= step;
        if (a === 0) {
          i++;
          a = countsA[i] || 0;
        }
        if (b === 0) {
          j++;
          b = countsB[j] || 0;
        }
      }
      return i === symbolsA.length && j === symbolsB.length;
    },
    mutations: {
      "compare-only-raw-runs": ({ symbolsA, countsA, symbolsB, countsB }) =>
        symbolsA === symbolsB &&
        JSON.stringify(countsA) === JSON.stringify(countsB),
      "compare-only-letter-order": ({ symbolsA, symbolsB }) =>
        symbolsA.replace(/(.)\1+/g, "$1") === symbolsB.replace(/(.)\1+/g, "$1"),
    },
    languages: {
      java: {
        starter:
          "class Solution {public boolean solve(String symbolsA,int[] countsA,String symbolsB,int[] countsB){return false;}}",
        reference:
          "class Solution {public boolean solve(String symbolsA,int[] countsA,String symbolsB,int[] countsB){int i=0,j=0;long a=countsA.length>0?countsA[0]:0,b=countsB.length>0?countsB[0]:0;while(i<symbolsA.length()&&j<symbolsB.length()){if(symbolsA.charAt(i)!=symbolsB.charAt(j))return false;long step=Math.min(a,b);a-=step;b-=step;if(a==0){i++;a=i<countsA.length?countsA[i]:0;}if(b==0){j++;b=j<countsB.length?countsB[j]:0;}}return i==symbolsA.length()&&j==symbolsB.length();}}",
      },
      cpp: {
        starter:
          "class Solution {public:bool solve(string symbolsA,vector<int> countsA,string symbolsB,vector<int> countsB){return false;}};",
        reference:
          "class Solution {public:bool solve(string symbolsA,vector<int> countsA,string symbolsB,vector<int> countsB){int i=0,j=0;long long a=countsA.empty()?0:countsA[0],b=countsB.empty()?0:countsB[0];while(i<(int)symbolsA.size()&&j<(int)symbolsB.size()){if(symbolsA[i]!=symbolsB[j])return false;long long step=min(a,b);a-=step;b-=step;if(a==0){i++;a=i<(int)countsA.size()?countsA[i]:0;}if(b==0){j++;b=j<(int)countsB.size()?countsB[j]:0;}}return i==(int)symbolsA.size()&&j==(int)symbolsB.size();}};",
      },
      python: {
        starter:
          "class Solution:\n    def solve(self, symbolsA, countsA, symbolsB, countsB):\n        return False\n",
        reference:
          "class Solution:\n    def solve(self, symbolsA, countsA, symbolsB, countsB):\n        i=j=0\n        a=countsA[0] if countsA else 0\n        b=countsB[0] if countsB else 0\n        while i<len(symbolsA) and j<len(symbolsB):\n            if symbolsA[i]!=symbolsB[j]:\n                return False\n            step=min(a,b)\n            a-=step;b-=step\n            if a==0:\n                i+=1;a=countsA[i] if i<len(countsA) else 0\n            if b==0:\n                j+=1;b=countsB[j] if j<len(countsB) else 0\n        return i==len(symbolsA) and j==len(symbolsB)\n",
      },
    },
  },
);
for (const def of definitions) {
  if (["two-pointers-01", "two-pointers-02"].includes(def.id))
    def.semanticConstraints = [
      { kind: "alphabet", field: "text", alphabet: "letters" },
    ];
  if (def.id === "two-pointers-04")
    def.semanticConstraints = [
      { kind: "sorted", field: "left" },
      { kind: "sorted", field: "right" },
    ];
  if (["two-pointers-05", "two-pointers-06"].includes(def.id))
    def.semanticConstraints = [{ kind: "sorted", field: "values" }];
  if (def.id === "two-pointers-10")
    def.semanticConstraints = [
      { kind: "alphabet", field: "symbolsA", alphabet: "lowercase" },
      { kind: "alphabet", field: "symbolsB", alphabet: "lowercase" },
      { kind: "lengths-equal", left: "symbolsA", right: "countsA" },
      { kind: "lengths-equal", left: "symbolsB", right: "countsB" },
    ];
}
// Remediation names skills taught by real earlier questions; completion is never inferred.
const pointerById = new Map(definitions.map(def => [def.id, def]));
pointerById.get('two-pointers-04').skillIds.push('sorted.order');
pointerById.get('two-pointers-04').prerequisites = ['arrays.traversal'];
pointerById.get('two-pointers-03').remedialIds = ['two-pointers-01', 'two-pointers-04'];
pointerById.get('two-pointers-04').remedialIds = ['two-pointers-01'];
pointerById.get('two-pointers-05').remedialIds = ['two-pointers-01', 'two-pointers-04', 'two-pointers-06'];
pointerById.get('two-pointers-06').remedialIds = ['two-pointers-01', 'two-pointers-04'];
pointerById.get('two-pointers-07').remedialIds = ['two-pointers-06', 'two-pointers-04'];
pointerById.get('two-pointers-09').remedialIds = ['sliding-window-01', 'arrays-hashing-01'];

// Complementary end-removal is a variable nonnegative-total window, not a fixed k-window.
pointerById.get('two-pointers-09').prerequisites = ['arrays.traversal','windows.variable-shrink','windows.positive-sum'];
pointerById.get('two-pointers-09').remedialIds = ['sliding-window-03','sliding-window-01','arrays-hashing-01'];
pointerById.get('two-pointers-10').remedialIds = ['two-pointers-04'];

if (process.argv[1]?.endsWith("two-pointers.mjs"))
  for (const def of definitions) console.log(await materializePack(def));
