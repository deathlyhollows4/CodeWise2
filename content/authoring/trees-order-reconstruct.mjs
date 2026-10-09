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
function encode(root) {
  if (!root) return [];
  const q = [root],
    out = [];
  for (const n of q) {
    if (!n) {
      out.push(null);
      continue;
    }
    out.push(n.val);
    q.push(n.left, n.right);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
function strictBST({ root }, localOnly = false) {
  const tree = decode(root),
    stack = tree ? [[tree, -Infinity, Infinity]] : [];
  while (stack.length) {
    const [n, lo, hi] = stack.pop();
    if (n.val <= lo || n.val >= hi) return false;
    if (n.left) stack.push([n.left, lo, n.val]);
    if (n.right) stack.push([n.right, n.val, hi]);
    if (localOnly) {
      const last = stack.length;
      if (n.left) stack[last - (n.right ? 2 : 1)][1] = -Infinity;
      if (n.right) stack[last - 1][2] = Infinity;
    }
  }
  return true;
}
function inorderIncreasing({ root }) {
  const stack = [];
  let n = decode(root),
    previous = -Infinity;
  while (n || stack.length) {
    while (n) {
      stack.push(n);
      n = n.left;
    }
    n = stack.pop();
    if (n.val <= previous) return false;
    previous = n.val;
    n = n.right;
  }
  return true;
}
function arbitraryCases() {
  const out = foundation[0]
    .generate()
    .map((c) => ({ input: { root: [...c.input.root] }, category: c.category }));
  for (const root of [
    [5, 3, 8, null, 6],
    [5, 3, 8, 1, 4, 6, 9],
    [0, -1000000000, 1000000000],
    [1, 1],
    [10, 5, 15, null, null, 6, 20],
  ])
    out.push({
      input: { root },
      category: "ancestor-bounds-or-duplicate-counterexample",
    });
  for (let size = 1; size <= 160; size++) {
    const sorted = Array.from({ length: size }, (_, i) => i - 80);
    const build = (lo, hi) => {
      if (lo === hi) return null;
      const mid = Math.floor((lo + hi) / 2);
      return {
        val: sorted[mid],
        left: build(lo, mid),
        right: build(mid + 1, hi),
      };
    };
    out.push({
      input: { root: encode(build(0, size)) },
      category: "valid-balanced-strict-order",
    });
  }
  return out;
}
function traversals(tree) {
  const preorder = [],
    inorder = [],
    stack = tree ? [tree] : [];
  while (stack.length) {
    const n = stack.pop();
    preorder.push(n.val);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  let n = tree;
  while (n || stack.length) {
    while (n) {
      stack.push(n);
      n = n.left;
    }
    n = stack.pop();
    inorder.push(n.val);
    n = n.right;
  }
  return { preorder, inorder };
}
function traversalCases() {
  return foundation[0].generate().map((c, index) => {
    const tree = decode(c.input.root),
      q = tree ? [tree] : [];
    let serial = 0;
    for (const n of q) {
      n.val = index % 2 ? 1000000000 - serial : -1000000000 + serial;
      serial++;
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    return { input: traversals(tree), category: "unique-values-" + c.category };
  });
}
function reconstruct({ preorder, inorder }) {
  if (!preorder.length) return [];
  const root = { val: preorder[0], left: null, right: null },
    stack = [root];
  let at = 0;
  for (let i = 1; i < preorder.length; i++) {
    const n = { val: preorder[i], left: null, right: null };
    let parent = stack.at(-1);
    if (parent.val !== inorder[at]) parent.left = n;
    else {
      while (stack.length && stack.at(-1).val === inorder[at]) {
        parent = stack.pop();
        at++;
      }
      parent.right = n;
    }
    stack.push(n);
  }
  return encode(root);
}
function partitionModel(input, validateOnly = false) {
  const { preorder, inorder } = input;
  if (preorder.length !== inorder.length) return false;
  const positions = new Map(inorder.map((v, i) => [v, i]));
  if (
    positions.size !== inorder.length ||
    new Set(preorder).size !== preorder.length ||
    preorder.some((v) => !positions.has(v))
  )
    return false;
  const nodes = new Map(),
    frames = preorder.length
      ? [{ pre: 0, start: 0, size: preorder.length, path: "" }]
      : [];
  for (const f of frames) {
    const val = preorder[f.pre],
      at = positions.get(val);
    if (at < f.start || at >= f.start + f.size) return false;
    nodes.set(f.path, val);
    const left = at - f.start,
      right = f.size - left - 1;
    if (left)
      frames.push({
        pre: f.pre + 1,
        start: f.start,
        size: left,
        path: f.path + "L",
      });
    if (right)
      frames.push({
        pre: f.pre + 1 + left,
        start: at + 1,
        size: right,
        path: f.path + "R",
      });
  }
  if (validateOnly) return true;
  if (!nodes.size) return [];
  const q = [""],
    out = [];
  for (const path of q) {
    if (!nodes.has(path)) {
      out.push(null);
      continue;
    }
    out.push(nodes.get(path));
    q.push(path + "L", path + "R");
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const native =
  "## Native interface\n\nThe runner supplies genuine TreeNode objects with `val`, `left`, and `right`. Missing children and an empty root are null. Do not redeclare the class or write a representation parser.\n\n### Representation note\n\nExample tree results use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. These arrays describe native trees.";
const integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 },
  rootSchema = foundation[0].inputSchema.properties.root;
export const definitions = [
  {
    id: "trees-21",
    slug: "validate-global-strict-bst-bounds",
    title: "Validate ordering across whole subtrees",
    primaryTopic: "trees",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.ancestor-order-bounds",
      "trees.inorder-strict-invariant",
    ],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-13", "trees-16"],
    nextIds: ["trees-14", "trees-15", "trees-20"],
    objective:
      "Test global strict search-tree ordering on an arbitrary native tree, including descendants and duplicate values.",
    rationale:
      "A child can satisfy its immediate parent comparison while violating an earlier ancestor bound.",
    statement:
      "## Validate a strict search tree\n\nReturn true if every node has all left-subtree values strictly smaller and all right-subtree values strictly larger than its own value. The input is an arbitrary binary tree; it is not promised to be ordered. Duplicate values anywhere make the answer false. Compare entire subtrees against ancestor bounds, not just immediate children. An empty tree and a singleton are valid. Preserve all original values and links.\n\n`solve(root)` receives a native root and returns boolean.\n\n" +
      native,
    constraints: foundation[0].constraints,
    interface: "Solution.solve(root) returns boolean.",
    inputSchema: foundation[0].inputSchema,
    semanticConstraints: [
      { kind: "tree-level", field: "root", maxNodes: 2000 },
    ],
    outputSchema: { kind: "boolean" },
    function: {
      arguments: [{ name: "root", type: "TreeNode" }],
      returnType: "boolean",
      readOnlyNodes: true,
    },
    generatorModule: "content/authoring/trees-order-reconstruct.mjs",
    generate: arbitraryCases,
    visible: [
      {
        input: { root: [5, 3, 8, 1, 4, 6, 9] },
        expected: true,
        explanation:
          "Every descendant stays within the strict bounds inherited from all its ancestors.",
      },
      {
        input: { root: [5, 3, 8, null, 6] },
        expected: false,
        explanation:
          "Node 6 is a right child of 3 but lies in the left subtree of 5, so it violates the earlier upper bound.",
      },
      {
        input: { root: [1, 1] },
        expected: false,
        explanation:
          "Equal parent and left-child values violate strict ordering.",
      },
    ],
    oracle: strictBST,
    independent: inorderIncreasing,
    mutations: {
      "check-immediate-children-only": (input) => strictBST(input, true),
      "allow-equal-values": ({ root }) => {
        const tree = decode(root),
          stack = tree ? [[tree, -Infinity, Infinity]] : [];
        while (stack.length) {
          const [n, lo, hi] = stack.pop();
          if (n.val < lo || n.val > hi) return false;
          if (n.left) stack.push([n.left, lo, n.val]);
          if (n.right) stack.push([n.right, n.val, hi]);
        }
        return true;
      },
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode n;long lo,hi;Frame(TreeNode x,long a,long b){n=x;lo=a;hi=b;}}public boolean solve(TreeNode root){if(root==null)return true;ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,Long.MIN_VALUE,Long.MAX_VALUE));while(!stack.isEmpty()){Frame f=stack.pop();TreeNode n=f.n;if(n.val<=f.lo||n.val>=f.hi)return false;if(n.left!=null)stack.push(new Frame(n.left,f.lo,n.val));if(n.right!=null)stack.push(new Frame(n.right,n.val,f.hi));}return true;}}",
      "class Solution {public:bool solve(TreeNode* root){if(!root)return true;vector<tuple<TreeNode*,long long,long long>> stack{{root,LLONG_MIN,LLONG_MAX}};while(!stack.empty()){auto [n,lo,hi]=stack.back();stack.pop_back();if(n->val<=lo||n->val>=hi)return false;if(n->left)stack.push_back({n->left,lo,n->val});if(n->right)stack.push_back({n->right,n->val,hi});}return true;}};",
      'class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [(root,float("-inf"),float("inf"))]\n        while stack:\n            node,lo,hi=stack.pop()\n            if not lo<node.val<hi:\n                return False\n            if node.left is not None:\n                stack.append((node.left,lo,node.val))\n            if node.right is not None:\n                stack.append((node.right,node.val,hi))\n        return True\n',
    ),
  },
  {
    id: "trees-24",
    slug: "native-tree-from-preorder-inorder",
    title: "Reconstruct the tree from two traversals",
    primaryTopic: "trees",
    step: 4,
    skillIds: [
      "trees.preorder-order",
      "trees.inorder-partition",
      "trees.traversal-pair-reconstruction",
    ],
    prerequisites: ["trees.preorder-order", "trees.child-links"],
    remedialIds: ["trees-01", "trees-04"],
    checkpointIds: ["trees-14", "trees-15"],
    nextIds: ["trees-12"],
    objective:
      "Reconstruct the unique native tree described by compatible distinct-valued preorder and inorder traversals.",
    rationale:
      "Preorder identifies each subtree root, while its inorder position divides the remaining nodes between left and right branches.",
    statement:
      "## Reconstruct the native tree\n\nReturn the unique binary tree whose preorder traversal is `preorder` and whose inorder traversal is `inorder`. Preorder visits root, left subtree, then right subtree. Inorder visits left subtree, root, then right subtree. Values are distinct. The arrays have equal lengths, contain the same values, and are guaranteed to be compatible traversals of one tree. Two empty arrays return null.\n\n`solve(preorder, inorder)` receives two native integer arrays and returns a newly constructed TreeNode root. You may use an iterative stack to handle a long skewed tree. Do not assume the values are sorted or that the result is a binary search tree.\n\n" +
      native,
    constraints: [
      "Both arrays contain 0 to 2,000 integers.",
      "All values lie in [-1,000,000,000,1,000,000,000].",
      "Values are unique, arrays have the same value set and are compatible traversals of one tree.",
    ],
    interface:
      "Solution.solve(preorder,inorder) receives int[] arrays and returns TreeNode.",
    inputSchema: {
      kind: "object",
      properties: {
        preorder: { kind: "array", maxLength: 2000, items: integer },
        inorder: { kind: "array", maxLength: 2000, items: integer },
      },
    },
    semanticConstraints: [
      {
        kind: "tree-traversal-pair",
        preorder: "preorder",
        inorder: "inorder",
        maxNodes: 2000,
      },
    ],
    valid: (input) => partitionModel(input, true),
    outputSchema: rootSchema,
    function: {
      arguments: [
        { name: "preorder", type: "int[]" },
        { name: "inorder", type: "int[]" },
      ],
      returnType: "TreeNode",
    },
    generatorModule: "content/authoring/trees-order-reconstruct.mjs",
    generate: traversalCases,
    visible: [
      {
        input: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] },
        expected: [3, 9, 20, null, null, 15, 7],
        explanation:
          "Root 3 splits inorder into left subtree [9] and right subtree [15,20,7]; preorder next identifies their roots.",
      },
      {
        input: { preorder: [2, 1, 3], inorder: [3, 1, 2] },
        expected: [2, 1, null, 3],
        explanation:
          "These traversals describe a left chain; values are not used as search-tree ordering.",
      },
      {
        input: { preorder: [], inorder: [] },
        expected: [],
        explanation: "Empty traversals describe a null root.",
      },
    ],
    oracle: reconstruct,
    independent: (input) => partitionModel(input),
    mutations: {
      "ignore-inorder-build-preorder-right-chain": ({ preorder }) => {
        let root = null;
        for (let i = preorder.length - 1; i >= 0; i--)
          root = { val: preorder[i], left: null, right: root };
        return encode(root);
      },
      "mirror-the-required-tree": (input) => {
        const root = decode(reconstruct(input)),
          q = root ? [root] : [];
        for (const n of q) {
          [n.left, n.right] = [n.right, n.left];
          if (n.left) q.push(n.left);
          if (n.right) q.push(n.right);
        }
        return encode(root);
      },
    },
    languages: refs(
      "class Solution {public TreeNode solve(int[] preorder,int[] inorder){if(preorder.length==0)return null;TreeNode root=new TreeNode(preorder[0]);ArrayDeque<TreeNode> stack=new ArrayDeque<>();stack.push(root);int at=0;for(int i=1;i<preorder.length;i++){TreeNode child=new TreeNode(preorder[i]),parent=stack.peek();if(parent.val!=inorder[at])parent.left=child;else{while(!stack.isEmpty()&&stack.peek().val==inorder[at]){parent=stack.pop();at++;}parent.right=child;}stack.push(child);}return root;}}",
      "class Solution {public:TreeNode* solve(vector<int> preorder,vector<int> inorder){if(preorder.empty())return nullptr;TreeNode* root=new TreeNode(preorder[0]);vector<TreeNode*> stack{root};size_t at=0;for(size_t i=1;i<preorder.size();i++){TreeNode* child=new TreeNode(preorder[i]);TreeNode* parent=stack.back();if(parent->val!=inorder[at])parent->left=child;else{while(!stack.empty()&&stack.back()->val==inorder[at]){parent=stack.back();stack.pop_back();at++;}parent->right=child;}stack.push_back(child);}return root;}};",
      "class Solution:\n    def solve(self, preorder, inorder):\n        if not preorder:\n            return None\n        root=TreeNode(preorder[0])\n        stack=[root]\n        at=0\n        for value in preorder[1:]:\n            child=TreeNode(value)\n            parent=stack[-1]\n            if parent.val!=inorder[at]:\n                parent.left=child\n            else:\n                while stack and stack[-1].val==inorder[at]:\n                    parent=stack.pop()\n                    at+=1\n                parent.right=child\n            stack.append(child)\n        return root\n",
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
      "Trees21/24 source-only author audit; traversal-pair runtime guard pending; no reference execution",
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
  report.traversalPromiseRegressions = [
    { input: { preorder: [], inorder: [] }, expected: true },
    { input: { preorder: [1, 2, 3], inorder: [2, 1, 3] }, expected: true },
    { input: { preorder: [1, 3, 2], inorder: [2, 1, 3] }, expected: false },
    { input: { preorder: [1, 2, 3], inorder: [3, 1, 2] }, expected: false },
    { input: { preorder: [1], inorder: [] }, expected: false },
    { input: { preorder: [1, 1], inorder: [1, 1] }, expected: false },
    { input: { preorder: [1, 2], inorder: [1, 3] }, expected: false },
  ].map((c) => ({
    ...c,
    actual: partitionModel(c.input, true),
    countedAsHidden: false,
  }));
  if (report.traversalPromiseRegressions.some((c) => c.actual !== c.expected))
    report.failures.push("traversal compatibility guard regression");
  writeFileSync(
    "docs/release-evidence/content-trees-order-reconstruct-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-order-reconstruct-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-order-reconstruct.mjs")) audit();
