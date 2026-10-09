import { definitions as foundation } from "./trees-first.mjs";
import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
function parentTree({ parents }, ignoreCapacity = false, forest = false) {
  if (!parents.length) return false;
  const children = Array.from({ length: parents.length }, () => []),
    roots = [];
  for (let i = 0; i < parents.length; i++) {
    const p = parents[i];
    if (p === -1) roots.push(i);
    else {
      if (p < 0 || p >= parents.length || p === i) return false;
      children[p].push(i);
      if (!ignoreCapacity && children[p].length > 2) return false;
    }
  }
  if (forest ? roots.length === 0 : roots.length !== 1) return false;
  const seen = new Set(),
    q = [...roots];
  for (const node of q) {
    if (seen.has(node)) return false;
    seen.add(node);
    q.push(...children[node]);
  }
  return seen.size === parents.length;
}
function parentIndependent({ parents }) {
  if (!parents.length) return false;
  const roots = parents.flatMap((p, i) => (p === -1 ? [i] : []));
  if (roots.length !== 1) return false;
  const capacity = new Map();
  for (const p of parents)
    if (p !== -1) {
      if (p < 0 || p >= parents.length) return false;
      capacity.set(p, (capacity.get(p) || 0) + 1);
      if (capacity.get(p) > 2) return false;
    }
  for (let node = 0; node < parents.length; node++) {
    const path = new Set();
    let cursor = node;
    while (cursor !== -1) {
      if (path.has(cursor)) return false;
      path.add(cursor);
      cursor = parents[cursor];
    }
    if (!path.has(roots[0])) return false;
  }
  return true;
}
function parentCases() {
  const random = seeded(0x251ab3),
    out = [];
  for (let test = 0; test < 800; test++) {
    const n = 1 + (random() % 80),
      parents = Array(n).fill(-1),
      available = [0],
      children = Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      const at = random() % available.length,
        p = available[at];
      parents[i] = p;
      if (++children[p] === 2) available.splice(at, 1);
      available.push(i);
    }
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = random() % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const remapped = Array(n);
    for (let i = 0; i < n; i++)
      remapped[order[i]] = parents[i] === -1 ? -1 : order[parents[i]];
    if (test % 4 === 1) remapped[random() % n] = n;
    else if (test % 4 === 2) remapped[order[0]] = order[0];
    else if (test % 4 === 3 && n > 1) remapped[order[1]] = -1;
    out.push({
      input: { parents: remapped },
      category:
        test % 4 ? "invalid-parent-table" : "permuted-valid-binary-tree",
    });
  }
  for (const parents of [
    [],
    [-1],
    [-1, 2, 1],
    [-1, 0, 0, 0],
    [-1, -1],
    [-1, 1],
    [-1, 2000],
    [-1, 0, 1, 2],
    Array.from({ length: 2000 }, (_, i) => i - 1),
    [-1, ...Array(1999).fill(0)],
  ])
    out.push({
      input: { parents },
      category: "connectivity-capacity-and-maximal-depth",
    });
  return out;
}
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    q = [root];
  let at = 1;
  for (const n of q)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const val = values[at++];
      if (val !== null) {
        n[side] = { val, left: null, right: null };
        q.push(n[side]);
      }
    }
  return root;
}
function routeCount(
  { root, target },
  skipExit = false,
  rootOnly = false,
  wrap32 = false,
) {
  const tree = decode(root),
    freq = new Map([[0, 1]]),
    stack = tree ? [[tree, 0, false]] : [];
  let count = 0;
  while (stack.length) {
    const [node, total, exit] = stack.pop();
    if (exit) {
      if (!skipExit) {
        const next = freq.get(total) - 1;
        if (next) freq.set(total, next);
        else freq.delete(total);
      }
      continue;
    }
    const sum = wrap32 ? (total + node.val) | 0 : total + node.val;
    count += rootOnly ? (sum === target ? 1 : 0) : freq.get(sum - target) || 0;
    freq.set(sum, (freq.get(sum) || 0) + 1);
    stack.push([node, sum, true]);
    if (node.right) stack.push([node.right, sum, false]);
    if (node.left) stack.push([node.left, sum, false]);
  }
  return count;
}
function routeIndependent({ root, target }) {
  const tree = decode(root),
    nodes = tree ? [tree] : [];
  for (const n of nodes) {
    if (n.left) nodes.push(n.left);
    if (n.right) nodes.push(n.right);
  }
  let count = 0;
  for (const start of nodes) {
    const stack = [[start, 0]];
    while (stack.length) {
      const [n, sum] = stack.pop(),
        next = sum + n.val;
      if (next === target) count++;
      if (n.left) stack.push([n.left, next]);
      if (n.right) stack.push([n.right, next]);
    }
  }
  return count;
}
function routeCases() {
  const out = foundation[0].generate().map((c, i) => ({
    input: {
      root: [...c.input.root],
      target:
        i % 3 === 0 ? 0 : i % 3 === 1 ? (c.input.root[0] ?? 0) : (i % 19) - 9,
    },
    category: c.category,
  }));
  for (const root of [
    [1, -1, -1],
    [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1],
    [0, 0, 0],
    [-1, -1, -1],
    [1000000000, 1000000000, -1000000000],
  ])
    for (const target of [
      -2000000000000, -1000000000, -2, -1, 0, 1, 2, 8, 1000000000, 2000000000,
      2000000000000,
    ])
      out.push({
        input: { root, target },
        category: "branch-prefix-zero-negative-and-wide-target",
      });
  const zeroChain = [];
  for (let i = 0; i < 2000; i++) {
    zeroChain.push(0);
    if (i < 1999) zeroChain.push(null);
  }
  out.push({
    input: { root: zeroChain, target: 0 },
    category: "two-million-overlapping-zero-routes",
  });
  out.push({
    input: {
      root: [1000000000, null, 1000000000, null, 1000000000],
      target: 3000000000,
    },
    category: "target-total-exceeds-signed-int32",
  });
  out.push({
    input: {
      root: zeroChain.map((v) => (v === null ? null : 1000000000)),
      target: 2000000000000,
    },
    category: "maximum-wide-root-to-last-total",
  });
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 };
export const definitions = [
  {
    id: "trees-25",
    slug: "validate-one-rooted-binary-parent-table",
    title: "Check a proposed binary parent table",
    primaryTopic: "trees",
    step: 3,
    skillIds: [
      "arrays.traversal",
      "trees.parent-map",
      "trees.rooted-acyclic-connectivity",
      "trees.binary-child-capacity",
    ],
    prerequisites: ["arrays.traversal"],
    remedialIds: ["arrays-hashing-01"],
    checkpointIds: ["trees-13", "trees-16", "trees-21"],
    nextIds: ["trees-14", "trees-15", "trees-24"],
    objective:
      "Decide whether proposed parent indices describe exactly one nonempty rooted tree with at most two children per node.",
    rationale:
      "One root and local parent bounds do not exclude a disconnected cycle or an overfull parent.",
    statement:
      "## Validate the proposed parent relationships\n\nThe integer array `parents` describes nodes identified by their array positions. `parents[i]` is the proposed parent of node i; -1 marks a root. Return true exactly when the table describes one nonempty rooted binary tree:\n\n- There is exactly one -1 entry.\n- Every other parent is a valid node index distinct from its child.\n- Every node reaches that one root by following parents, with no cycle or disconnected component.\n- Each parent has at most two children.\n\nThe children are not labelled left and right; the test asks whether the relationships can form a binary tree, not whether values follow search-tree ordering. An empty table returns false. Out-of-range indices, extra roots and self-parent links return false.\n\n`solve(parents)` receives the native integer array and returns boolean. No TreeNode construction or input parsing is required.",
    constraints: [
      "0 ≤ parents.length ≤ 2,000.",
      "Every entry lies in [-1,2,000]; an entry outside the actual node-index range is an invalid proposal.",
      "Array position is the node identity. Node values and child-side order are not part of the input.",
    ],
    interface: "Solution.solve(parents) receives int[] and returns boolean.",
    inputSchema: {
      kind: "object",
      properties: {
        parents: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "integer", minimum: -1, maximum: 2000 },
        },
      },
    },
    semanticConstraints: [],
    outputSchema: { kind: "boolean" },
    function: {
      arguments: [{ name: "parents", type: "int[]" }],
      returnType: "boolean",
    },
    generatorModule: "content/authoring/trees-parent-target-routes.mjs",
    generate: parentCases,
    visible: [
      {
        input: { parents: [2, 0, -1, 2] },
        expected: true,
        explanation:
          "Node 2 is the root; its children are 0 and 3, and node 0 has child 1. Every node reaches 2.",
      },
      {
        input: { parents: [-1, 2, 1] },
        expected: false,
        explanation:
          "Nodes 1 and 2 form a disconnected cycle even though node 0 is the only declared root.",
      },
      {
        input: { parents: [-1, 0, 0, 0] },
        expected: false,
        explanation: "Root 0 has three children, exceeding binary capacity.",
      },
    ],
    oracle: parentTree,
    independent: parentIndependent,
    mutations: {
      "ignore-child-capacity": (input) => parentTree(input, true),
      "accept-multiple-root-forest": (input) => parentTree(input, false, true),
      "check-only-one-root-and-capacity": ({ parents }) => {
        if (parents.filter((p) => p === -1).length !== 1) return false;
        const counts = Array(parents.length).fill(0);
        for (const p of parents)
          if (p !== -1) {
            if (p < 0 || p >= parents.length || ++counts[p] > 2) return false;
          }
        return true;
      },
    },
    languages: refs(
      "class Solution {public boolean solve(int[] parents){int n=parents.length;if(n==0)return false;ArrayList<ArrayList<Integer>> children=new ArrayList<>();for(int i=0;i<n;i++)children.add(new ArrayList<>());int root=-1;for(int i=0;i<n;i++){int p=parents[i];if(p==-1){if(root!=-1)return false;root=i;}else{if(p<0||p>=n||p==i)return false;children.get(p).add(i);if(children.get(p).size()>2)return false;}}if(root==-1)return false;boolean[] seen=new boolean[n];ArrayList<Integer> queue=new ArrayList<>();queue.add(root);for(int i=0;i<queue.size();i++){int at=queue.get(i);if(seen[at])return false;seen[at]=true;queue.addAll(children.get(at));}return queue.size()==n;}}",
      "class Solution {public:bool solve(vector<int> parents){int n=(int)parents.size();if(!n)return false;vector<vector<int>> children(n);int root=-1;for(int i=0;i<n;i++){int p=parents[i];if(p==-1){if(root!=-1)return false;root=i;}else{if(p<0||p>=n||p==i)return false;children[p].push_back(i);if(children[p].size()>2)return false;}}if(root==-1)return false;vector<bool> seen(n);vector<int> queue{root};for(size_t i=0;i<queue.size();i++){int at=queue[i];if(seen[at])return false;seen[at]=true;for(int child:children[at])queue.push_back(child);}return queue.size()==parents.size();}};",
      "class Solution:\n    def solve(self, parents):\n        n=len(parents)\n        if not n:\n            return False\n        children=[[] for _ in parents]\n        root=None\n        for i,parent in enumerate(parents):\n            if parent==-1:\n                if root is not None:\n                    return False\n                root=i\n            else:\n                if parent<0 or parent>=n or parent==i:\n                    return False\n                children[parent].append(i)\n                if len(children[parent])>2:\n                    return False\n        if root is None:\n            return False\n        seen=set()\n        queue=[root]\n        for node in queue:\n            if node in seen:\n                return False\n            seen.add(node)\n            queue.extend(children[node])\n        return len(seen)==n\n",
    ),
  },
  {
    id: "trees-26",
    slug: "count-all-downward-signed-target-routes",
    title: "Count target-total routes starting anywhere",
    primaryTopic: "trees",
    step: 4,
    skillIds: [
      "trees.child-links",
      "numbers.signed-accumulation",
      "trees.branch-prefix-frequency",
      "trees.all-downward-route-count",
    ],
    prerequisites: ["trees.child-links", "numbers.signed-accumulation"],
    remedialIds: ["trees-01", "arrays-hashing-01", "trees-11"],
    checkpointIds: ["trees-14", "trees-15", "trees-24"],
    nextIds: ["trees-12"],
    objective:
      "Count every nonempty ancestor-to-descendant route with the target signed sum, including routes beginning below the root and overlapping routes.",
    rationale:
      "Current-branch prefix frequencies count all start positions; removing a prefix on branch exit prevents sibling leakage.",
    statement:
      "## Count all downward target routes\n\nReturn the number of nonempty routes whose node values sum to `target`. A route starts at any node and follows zero or more child links downward, ending at any descendant, including its starting node. It cannot turn upward or switch between sibling branches. The endpoints need not be the root or leaves. Count different start/end node pairs separately, even when their values are identical. Routes may overlap.\n\nValues may be negative or zero. An empty tree returns zero, including when target is zero; an empty route never counts. Use wide signed arithmetic for totals and prefix differences. The answer fits an ordinary integer: at most 2,001,000 routes for 2,000 nodes.\n\n`solve(root,target)` receives a genuine TreeNode root and a wide integer. Nodes have `val`, `left`, and `right`; missing children are null. Preserve original values and links. The runner supplies the class and constructs the tree; do not redeclare it or parse the example representation.\n\n### Representation note\n\nExamples use compact breadth-first arrays with null child slots and no trailing nulls; child slots are read for existing parents in queue order. Your function receives the native root.",
    constraints: [
      ...foundation[0].constraints,
      "-2,000,000,000,000 ≤ target ≤ 2,000,000,000,000.",
      "A route follows child links only; start and end are any original nodes.",
    ],
    interface:
      "Solution.solve(root,target) receives TreeNode and long / long long and returns int.",
    inputSchema: {
      kind: "object",
      properties: {
        root: foundation[0].inputSchema.properties.root,
        target: {
          kind: "integer",
          minimum: -2000000000000,
          maximum: 2000000000000,
        },
      },
    },
    semanticConstraints: [
      { kind: "tree-level", field: "root", maxNodes: 2000 },
    ],
    outputSchema: { kind: "integer", minimum: 0, maximum: 2001000 },
    function: {
      arguments: [
        { name: "root", type: "TreeNode" },
        { name: "target", type: "long" },
      ],
      returnType: "int",
      readOnlyNodes: true,
    },
    generatorModule: "content/authoring/trees-parent-target-routes.mjs",
    generate: routeCases,
    visible: [
      {
        input: { root: [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], target: 8 },
        expected: 3,
        explanation:
          "The routes 5 → 3, 5 → 2 → 1, and -3 → 11 total 8. None starts at the root.",
      },
      {
        input: { root: [0, 0, 0], target: 0 },
        expected: 5,
        explanation:
          "Three singleton routes and the two root-to-child routes count; a route between the two children does not.",
      },
      {
        input: { root: [], target: 0 },
        expected: 0,
        explanation: "An empty route is excluded.",
      },
    ],
    oracle: routeCount,
    independent: routeIndependent,
    mutations: {
      "leak-prefixes-between-sibling-branches": (input) =>
        routeCount(input, true),
      "count-only-root-starts": (input) => routeCount(input, false, true),
      "signed-int32-prefix-accumulator": (input) =>
        routeCount(input, false, false, true),
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode n;long sum;boolean exit;Frame(TreeNode x,long s,boolean e){n=x;sum=s;exit=e;}}public int solve(TreeNode root,long target){if(root==null)return 0;HashMap<Long,Integer> frequency=new HashMap<>();frequency.put(0L,1);ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,0,false));int answer=0;while(!stack.isEmpty()){Frame f=stack.pop();if(f.exit){int count=frequency.get(f.sum)-1;if(count==0)frequency.remove(f.sum);else frequency.put(f.sum,count);continue;}long sum=f.sum+f.n.val;answer+=frequency.getOrDefault(sum-target,0);frequency.put(sum,frequency.getOrDefault(sum,0)+1);stack.push(new Frame(f.n,sum,true));if(f.n.right!=null)stack.push(new Frame(f.n.right,sum,false));if(f.n.left!=null)stack.push(new Frame(f.n.left,sum,false));}return answer;}}",
      "class Solution {public:int solve(TreeNode* root,long long target){if(!root)return 0;unordered_map<long long,int> frequency{{0,1}};vector<tuple<TreeNode*,long long,bool>> stack{{root,0,false}};int answer=0;while(!stack.empty()){auto [node,prior,exit]=stack.back();stack.pop_back();if(exit){auto found=frequency.find(prior);if(--found->second==0)frequency.erase(found);continue;}long long sum=prior+node->val;auto found=frequency.find(sum-target);if(found!=frequency.end())answer+=found->second;frequency[sum]++;stack.push_back({node,sum,true});if(node->right)stack.push_back({node->right,sum,false});if(node->left)stack.push_back({node->left,sum,false});}return answer;}};",
      "class Solution:\n    def solve(self, root, target):\n        frequency={0:1}\n        stack=[] if root is None else [(root,0,False)]\n        answer=0\n        while stack:\n            node,prior,exit=stack.pop()\n            if exit:\n                count=frequency[prior]-1\n                if count:\n                    frequency[prior]=count\n                else:\n                    del frequency[prior]\n                continue\n            total=prior+node.val\n            answer+=frequency.get(total-target,0)\n            frequency[total]=frequency.get(total,0)+1\n            stack.append((node,total,True))\n            if node.right is not None:\n                stack.append((node.right,total,False))\n            if node.left is not None:\n                stack.append((node.left,total,False))\n        return answer\n",
    ),
  },
];
for (const d of definitions) {
  const starters = buildFunctionStarters(d.function);
  for (const language of ["java", "cpp", "python"])
    d.languages[language].starter = starters[language];
}
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trees25/26 source-only author audit; no language reference execution",
    prepared: [],
    failures: [],
  };
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden]) {
      const result = d.oracle(c.input);
      if (JSON.stringify(result) !== JSON.stringify(d.independent(c.input)))
        report.failures.push(d.id + ": independent mismatch");
      if (
        c.expected !== undefined &&
        JSON.stringify(result) !== JSON.stringify(c.expected)
      )
        report.failures.push(d.id + ": expected mismatch");
    }
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(d.id + ": mutation " + m.name);
    report.prepared.push({
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-trees-parent-target-routes-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-parent-target-routes-template-sources.json",
    JSON.stringify(
      definitions.map((d) => ({
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      })),
    ),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("trees-parent-target-routes.mjs")) audit();
