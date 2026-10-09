import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    q = [root];
  let at = 1;
  for (const n of q)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const v = values[at++];
      if (v !== null) {
        n[side] = { val: v, left: null, right: null };
        q.push(n[side]);
      }
    }
  return root;
}
function toggleCount({ root }, ignoreInherited = false) {
  const tree = decode(root),
    stack = tree ? [[tree, 0]] : [];
  let count = 0;
  while (stack.length) {
    const [n, inherited] = stack.pop();
    let parity = ignoreInherited ? 0 : inherited;
    if ((n.val ^ parity) === 1) {
      count++;
      parity ^= 1;
    }
    if (n.left) stack.push([n.left, parity]);
    if (n.right) stack.push([n.right, parity]);
  }
  return count;
}
function toggleIndependent({ root }) {
  const tree = decode(root);
  if (!tree) return 0;
  const q = [tree];
  let count = tree.val;
  for (const n of q)
    for (const child of [n.left, n.right])
      if (child) {
        if (child.val !== n.val) count++;
        q.push(child);
      }
  return count;
}
function toggleCases() {
  const out = foundation[0]
    .generate()
    .map((c) => ({
      input: {
        root: c.input.root.map((v) => (v === null ? null : Math.abs(v) % 2)),
      },
      category: "binary-" + c.category,
    }));
  for (const root of [
    [1, 1, 0, 0, 1, 0, 1],
    [1, 1, 1],
    [0, 1, 0],
    [1, 0, 1, 1, 0],
  ])
    out.push({
      input: { root },
      category: "divergent-sibling-parity-and-ancestor-flips",
    });
  return out;
}
function maximumPath(
  { root },
  forceEmpty = false,
  rootOnly = false,
  wrap32 = false,
) {
  const tree = decode(root);
  if (!tree) return 0;
  const order = [tree],
    down = new Map();
  let best = forceEmpty ? 0 : -Infinity;
  for (const n of order) {
    if (n.left) order.push(n.left);
    if (n.right) order.push(n.right);
  }
  for (const n of order.reverse()) {
    const a = Math.max(0, down.get(n.left) || 0),
      b = Math.max(0, down.get(n.right) || 0);
    let through = n.val + a + b,
      d = n.val + Math.max(a, b);
    if (wrap32) {
      through |= 0;
      d |= 0;
    }
    if (!rootOnly || n === tree) best = Math.max(best, through);
    down.set(n, d);
  }
  return best;
}
function maximumIndependent({ root }) {
  const tree = decode(root);
  if (!tree) return 0;
  const q = [tree],
    edges = new Map([[tree, []]]);
  for (const n of q)
    for (const child of [n.left, n.right])
      if (child) {
        edges.get(n).push(child);
        edges.set(child, [n]);
        q.push(child);
      }
  let best = -Infinity;
  for (const start of q) {
    const routes = [[start, null, start.val]];
    for (const [node, parent, sum] of routes) {
      best = Math.max(best, sum);
      for (const next of edges.get(node))
        if (next !== parent) routes.push([next, node, sum + next.val]);
    }
  }
  return best;
}
function maxCases() {
  const out = foundation[0].generate();
  for (const root of [
    [-100, 10, 20, 30, 40],
    [-3, -2, -5],
    [1000000000, 1000000000, 1000000000],
    [0, -1, -2],
    [1, -5, 6, null, null, -2, 7],
  ])
    out.push({
      input: { root },
      category: "signed-branch-pruning-nonroot-and-wide-path",
    });
  const chain = [];
  for (let i = 0; i < 2000; i++) {
    chain.push(1000000000);
    if (i < 1999) chain.push(null);
  }
  out.push({ input: { root: chain }, category: "maximum-2e12-positive-path" });
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-toggle-maxpath.mjs",
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "int",
    readOnlyNodes: true,
  },
};
const native =
  "## Native interface\n\n`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve the input values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.\n\n### Representation note\n\nExamples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your function receives the native root.";
export const definitions = [
  {
    ...common,
    id: "trees-27",
    slug: "minimum-whole-subtree-bit-toggles",
    title: "Clear every bit with subtree toggles",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.branch-toggle-parity",
      "trees.forced-subtree-flip",
    ],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-13", "trees-16", "trees-21", "trees-25"],
    nextIds: ["trees-14", "trees-15", "trees-26"],
    objective:
      "Find the minimum number of conceptual whole-subtree bit toggles that makes every node value zero.",
    rationale:
      "Once ancestor toggles are fixed, only a toggle rooted at the current node can correct that node without changing an ancestor; carry its parity separately into both branches.",
    statement:
      "## Clear the tree with subtree operations\n\nEvery node value is 0 or 1. One operation chooses a node and flips every bit in its rooted subtree, including the chosen node. A flip changes 0 to 1 and 1 to 0. Return the minimum number of operations needed to make every node zero. Operations are conceptual: do not modify the input tree. The empty tree returns zero.\n\nAn ancestor operation affects both branches. A decision inside one branch does not affect its sibling. Toggling the same subtree twice cancels itself, so a minimum plan never needs to repeat the same chosen node.\n\n### Why branch parity matters\n\nAfter the choices at a node’s ancestors, its effective bit is fixed. Descendant operations cannot change that node. If its effective bit is one, a toggle at that node is forced; if it is zero, toggling there would require a redundant second toggle. Apply this decision independently down each branch to obtain a minimum plan. Return its operation count, not a list of nodes.\n\n" +
      native,
    constraints: [
      "The tree contains 0 to 2,000 nodes.",
      "Every node value is exactly 0 or 1.",
      "Each operation flips an entire rooted subtree; operations do not change tree links.",
    ],
    interface: "Solution.solve(root) returns int.",
    inputSchema: {
      kind: "object",
      properties: {
        root: {
          kind: "array",
          maxLength: 4001,
          trimTrailingNulls: true,
          items: {
            kind: "nullable",
            value: { kind: "integer", minimum: 0, maximum: 1 },
          },
        },
      },
    },
    outputSchema: { kind: "integer", minimum: 0, maximum: 2000 },
    generate: toggleCases,
    visible: [
      {
        input: { root: [1, 1, 1] },
        expected: 1,
        explanation: "One root-subtree toggle changes all three bits to zero.",
      },
      {
        input: { root: [1, 0, 1, 1, 1] },
        expected: 4,
        explanation:
          "Toggle the root, its left child, and both children of that left child. The right branch needs no additional toggle.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "There are no bits to clear.",
      },
    ],
    oracle: toggleCount,
    independent: toggleIndependent,
    mutations: {
      "ignore-inherited-flip-parity": (input) => toggleCount(input, true),
      "only-one-operation-for-any-nonzero-tree": ({ root }) =>
        root.includes(1) ? 1 : 0,
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode n;int parity;Frame(TreeNode x,int p){n=x;parity=p;}}public int solve(TreeNode root){if(root==null)return 0;ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,0));int answer=0;while(!stack.isEmpty()){Frame f=stack.pop();int parity=f.parity;if((f.n.val^parity)==1){answer++;parity^=1;}if(f.n.left!=null)stack.push(new Frame(f.n.left,parity));if(f.n.right!=null)stack.push(new Frame(f.n.right,parity));}return answer;}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;vector<pair<TreeNode*,int>> stack{{root,0}};int answer=0;while(!stack.empty()){auto [node,parity]=stack.back();stack.pop_back();if((node->val^parity)==1){answer++;parity^=1;}if(node->left)stack.push_back({node->left,parity});if(node->right)stack.push_back({node->right,parity});}return answer;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [(root,0)]\n        answer=0\n        while stack:\n            node,parity=stack.pop()\n            if node.val^parity:\n                answer+=1\n                parity^=1\n            if node.left is not None:\n                stack.append((node.left,parity))\n            if node.right is not None:\n                stack.append((node.right,parity))\n        return answer\n",
    ),
  },
  {
    ...common,
    id: "trees-28",
    slug: "maximum-signed-arbitrary-node-path-total",
    title: "Maximize a signed path total anywhere",
    step: 5,
    skillIds: [
      "trees.child-links",
      "trees.two-arm-path-join",
      "trees.positive-branch-gain",
      "numbers.signed-accumulation",
    ],
    prerequisites: [
      "trees.child-links",
      "trees.two-arm-path-join",
      "numbers.signed-accumulation",
    ],
    remedialIds: ["trees-01", "trees-14", "arrays-hashing-01"],
    checkpointIds: ["trees-12"],
    nextIds: [],
    objective:
      "Find the maximum signed total of a nonempty simple path between any two nodes, discarding harmful child branches without allowing an empty result.",
    rationale:
      "A completed path can use two child gains, but the contribution passed upward can use at most one; negative gains must be dropped while an all-negative tree still selects one node.",
    statement:
      "## Best nonempty simple path\n\nA path is a nonempty sequence of distinct adjacent nodes connected by parent-child edges. Its endpoints may be any nodes. It can join two branches through an ancestor, but cannot revisit a node. Return the largest sum of node values on any such path. Include both endpoints.\n\nFor a nonempty tree, at least one node must be selected. Therefore an all-negative tree returns its largest node value, not zero. For an empty tree only, return zero. The optimal path need not pass through the root and need not end at leaves. Use a wide integer for accumulated totals.\n\n" +
      native,
    constraints: [
      ...foundation[0].constraints,
      "A nonempty input requires a nonempty path; only an empty input returns the empty-tree value zero.",
      "Return a signed wide integer; a 2,000-node positive chain can total 2,000,000,000,000.",
    ],
    interface: "Solution.solve(root) returns long / long long.",
    inputSchema: foundation[0].inputSchema,
    outputSchema: {
      kind: "integer",
      minimum: -1000000000,
      maximum: 2000000000000,
    },
    function: { ...common.function, returnType: "long" },
    generate: maxCases,
    visible: [
      {
        input: { root: [-10, 9, 20, null, null, 15, 7] },
        expected: 42,
        explanation:
          "The best path 15 → 20 → 7 totals 42 and avoids the negative root.",
      },
      {
        input: { root: [-3, -2, -5] },
        expected: -2,
        explanation:
          "Selecting the single node -2 is better than any longer path; an empty path is not allowed.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "The empty-tree exception returns zero.",
      },
    ],
    oracle: maximumPath,
    independent: maximumIndependent,
    mutations: {
      "allow-empty-path-in-nonempty-tree": (input) => maximumPath(input, true),
      "force-path-through-root": (input) => maximumPath(input, false, true),
      "signed-int32-path-accumulator": (input) =>
        maximumPath(input, false, false, true),
    },
    languages: refs(
      "class Solution {public long solve(TreeNode root){if(root==null)return 0;ArrayList<TreeNode> order=new ArrayList<>();order.add(root);for(int i=0;i<order.size();i++){TreeNode n=order.get(i);if(n.left!=null)order.add(n.left);if(n.right!=null)order.add(n.right);}IdentityHashMap<TreeNode,Long> down=new IdentityHashMap<>();long best=Long.MIN_VALUE;for(int i=order.size()-1;i>=0;i--){TreeNode n=order.get(i);long a=n.left==null?0:Math.max(0L,down.get(n.left)),b=n.right==null?0:Math.max(0L,down.get(n.right));best=Math.max(best,(long)n.val+a+b);down.put(n,(long)n.val+Math.max(a,b));}return best;}}",
      "class Solution {public:long long solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> order{root};for(size_t i=0;i<order.size();i++){auto n=order[i];if(n->left)order.push_back(n->left);if(n->right)order.push_back(n->right);}unordered_map<TreeNode*,long long> down;long long best=LLONG_MIN;for(auto i=order.rbegin();i!=order.rend();++i){auto n=*i;long long a=n->left?max(0LL,down.at(n->left)):0,b=n->right?max(0LL,down.at(n->right)):0;best=max(best,(long long)n->val+a+b);down[n]=(long long)n->val+max(a,b);}return best;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return 0\n        order=[root]\n        for node in order:\n            if node.left is not None:\n                order.append(node.left)\n            if node.right is not None:\n                order.append(node.right)\n        down={}\n        best=None\n        for node in reversed(order):\n            a=0 if node.left is None else max(0,down[node.left])\n            b=0 if node.right is None else max(0,down[node.right])\n            total=node.val+a+b\n            best=total if best is None else max(best,total)\n            down[node]=node.val+max(a,b)\n        return best\n",
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
      "Trees27/28 source-only author audit; no language reference execution",
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
    "docs/release-evidence/content-trees-toggle-maxpath-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-toggle-maxpath-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-toggle-maxpath.mjs")) audit();
