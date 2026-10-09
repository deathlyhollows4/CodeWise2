import { strictBstPreparation } from "./trees-bst-updates.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], index: 0, left: null, right: null },
    q = [root];
  let at = 1;
  for (const n of q)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const index = at++,
        v = values[index];
      if (v !== null) {
        n[side] = { val: v, index, left: null, right: null };
        q.push(n[side]);
      }
    }
  return root;
}
function rankedNode({ root, k }, zeroBased = false) {
  let n = decode(root);
  const stack = [];
  if (zeroBased) k++;
  while (n || stack.length) {
    while (n) {
      stack.push(n);
      n = n.left;
    }
    n = stack.pop();
    if (--k === 0) return n.index;
    n = n.right;
  }
  return null;
}
function rankIndependent({ root, k }) {
  const nodes = root.flatMap((val, index) =>
    val === null ? [] : [{ val, index }],
  );
  nodes.sort((a, b) => a.val - b.val);
  return nodes[k - 1]?.index ?? null;
}
function rankCases() {
  return strictBstPreparation.generate().map((c, i) => {
    const n = c.input.root.filter((v) => v !== null).length;
    return {
      input: {
        root: [...c.input.root],
        k:
          i % 4 === 0
            ? 1
            : i % 4 === 1
              ? Math.max(1, Math.floor(n / 2))
              : i % 4 === 2
                ? Math.max(1, n)
                : Math.min(2000, n + 1),
      },
      category:
        i % 4 === 3 ? "missing-rank-null" : "existing-original-node-rank",
    };
  });
}
function rangeTotal({ root, lo, hi }, exclusive = false, wrap32 = false) {
  const tree = decode(root),
    stack = tree ? [tree] : [];
  let sum = 0;
  while (stack.length) {
    const n = stack.pop();
    if (n.val < lo) {
      if (n.right) stack.push(n.right);
    } else if (n.val > hi) {
      if (n.left) stack.push(n.left);
    } else {
      if (!exclusive || (n.val > lo && n.val < hi)) sum += n.val;
      if (wrap32) sum |= 0;
      if (n.left) stack.push(n.left);
      if (n.right) stack.push(n.right);
    }
  }
  return sum;
}
function rangeIndependent({ root, lo, hi }) {
  return root.reduce(
    (sum, value) =>
      sum + (value !== null && value >= lo && value <= hi ? value : 0),
    0,
  );
}
function rangeCases() {
  const out = strictBstPreparation.generate().map((c, i) => {
    const values = c.input.root.filter((v) => v !== null).sort((a, b) => a - b);
    let lo, hi;
    if (i % 4 === 0) {
      lo = -1000000000;
      hi = 1000000000;
    } else if (i % 4 === 1) {
      lo = hi = values.length ? values[Math.floor(values.length / 2)] : 0;
    } else if (i % 4 === 2) {
      lo = values.length ? values[0] : -1;
      hi = values.length ? values.at(-1) : 1;
    } else {
      lo = -10;
      hi = 10;
    }
    return {
      input: { root: [...c.input.root], lo, hi },
      category:
        i % 4 === 1
          ? "inclusive-single-key-boundary"
          : "inclusive-native-bst-range",
    };
  });
  const wide = [];
  for (let i = 0; i < 2000; i++) {
    wide.push(999998001 + i);
    if (i < 1999) wide.push(null);
  }
  out.push({
    input: { root: wide, lo: 999998001, hi: 1000000000 },
    category: "maximum-skew-wide-positive-range",
  });
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const rootSchema = strictBstPreparation.inputSchema.properties.root,
  integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 };
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-bst-rank-range.mjs",
  constraints: [
    "The input has 0 to 2,000 native nodes.",
    "All node values lie in [-1,000,000,000,1,000,000,000].",
    "All original values are distinct. Every left subtree value is strictly less than its root and every right subtree value is strictly greater.",
  ],
  semanticConstraints: strictBstPreparation.semanticConstraints,
  valid: strictBstPreparation.valid,
};
const native =
  "## Native tree contract\n\nThe root is a genuine TreeNode with `val`, `left`, and `right`; missing children and an empty root are null. Input values are unique. All values in a left subtree are strictly smaller than its root, and all values in a right subtree are strictly larger. This is a whole-subtree ordering promise, not only a parent-child comparison. Preserve original values and links. The runner supplies the class and constructs the input; do not redeclare TreeNode or write a parser.\n\n### Representation note\n\nExamples use compact breadth-first arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives the native root.";
export const definitions = [
  {
    ...common,
    id: "trees-22",
    slug: "original-kth-smallest-bst-node",
    title: "Return the original node at a sorted rank",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.inorder-rank",
      "trees.original-target-identity",
    ],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-19", "trees-23"],
    nextIds: ["trees-20", "trees-24"],
    objective:
      "Return the original native node at a one-based key rank, or null when that rank does not exist.",
    constraints: [
      ...common.constraints,
      "1 ≤ k ≤ 2,000; a missing rank returns null.",
    ],
    rationale:
      "Inorder traversal visits strict-BST keys in increasing order, but the returned object must be the original node rather than an equal-valued replacement.",
    statement:
      "## Select an original node by key rank\n\nReturn the original TreeNode whose key is the kth smallest in the tree. k is one-based: k=1 asks for the minimum key. If the tree has fewer than k nodes, return null. An empty root always returns null.\n\nReturn the actual existing object, not its integer value and not a newly allocated node with the same value. Preserve all original links and values. `solve(root,k)` receives the native root and integer rank, and returns TreeNode or null.\n\n" +
      native +
      "\n\n### Identity in example results\n\nThe checker displays a returned node as its original non-null slot index in the example input array. That display is not your return type: return the native object, and the runner checks its identity.",
    interface: "Solution.solve(root,k) returns an original TreeNode or null.",
    inputSchema: {
      kind: "object",
      properties: {
        root: rootSchema,
        k: { kind: "integer", minimum: 1, maximum: 2000 },
      },
    },
    outputSchema: {
      kind: "nullable",
      value: { kind: "integer", minimum: 0, maximum: 4000 },
    },
    function: {
      arguments: [
        { name: "root", type: "TreeNode" },
        { name: "k", type: "int" },
      ],
      returnType: "TreeNodeIdentity",
      readOnlyNodes: true,
    },
    generate: rankCases,
    visible: [
      {
        input: { root: [5, 3, 8, 1, 4, 6, 9], k: 3 },
        expected: 4,
        explanation:
          "Sorted keys begin 1, 3, 4. Return the existing node with key 4 at original array slot 4.",
      },
      {
        input: { root: [8, 3, 10, null, 6, 9], k: 2 },
        expected: 4,
        explanation:
          "Sorted keys are 3, 6, 8, 9, 10. The second node has key 6 and original slot 4.",
      },
      {
        input: { root: [5, 3, 8], k: 4 },
        expected: null,
        explanation:
          "Only three original nodes exist, so rank 4 has no result.",
      },
    ],
    oracle: rankedNode,
    independent: rankIndependent,
    mutations: {
      "treat-k-as-zero-based": (input) => rankedNode(input, true),
      "return-key-instead-of-original-node-id": ({ root, k }) =>
        root.filter((v) => v !== null).sort((a, b) => a - b)[k - 1] ?? null,
    },
    languages: refs(
      "class Solution {public TreeNode solve(TreeNode root,int k){ArrayDeque<TreeNode> stack=new ArrayDeque<>();TreeNode n=root;while(n!=null||!stack.isEmpty()){while(n!=null){stack.push(n);n=n.left;}n=stack.pop();if(--k==0)return n;n=n.right;}return null;}}",
      "class Solution {public:TreeNode* solve(TreeNode* root,int k){vector<TreeNode*> stack;auto n=root;while(n||!stack.empty()){while(n){stack.push_back(n);n=n->left;}n=stack.back();stack.pop_back();if(--k==0)return n;n=n->right;}return nullptr;}};",
      "class Solution:\n    def solve(self, root, k):\n        stack=[]\n        node=root\n        while node is not None or stack:\n            while node is not None:\n                stack.append(node)\n                node=node.left\n            node=stack.pop()\n            k-=1\n            if k==0:\n                return node\n            node=node.right\n        return None\n",
    ),
  },
  {
    ...common,
    id: "trees-23",
    slug: "inclusive-bst-range-wide-total",
    title: "Total the keys inside an inclusive range",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.ordered-range-pruning",
      "numbers.signed-accumulation",
    ],
    prerequisites: [
      "trees.child-links",
      "trees.bst-search-route",
      "numbers.signed-accumulation",
    ],
    remedialIds: ["trees-01", "trees-19", "arrays-hashing-01"],
    checkpointIds: ["trees-19", "trees-22"],
    nextIds: ["trees-20", "trees-26"],
    objective:
      "Sum every native key in the inclusive bounds, pruning branches ruled out by strict subtree ordering.",
    rationale:
      "A key below lo rules out its whole left subtree; a key above hi rules out its whole right subtree. Signed keys still require wide totals and inclusive endpoints.",
    statement:
      "## Inclusive key-range total\n\nReturn the sum of all node values between lo and hi, including both endpoints. lo≤hi. An empty tree or a range containing no key returns zero. Negative values are included normally and may make the total negative. Use a wide integer for the result.\n\n`solve(root,lo,hi)` receives the native root and two integer bounds. Use the search-tree ordering to skip subtrees that cannot contain a key in the range. Every matching original node contributes exactly once.\n\n" +
      native,
    constraints: [
      ...common.constraints,
      "-1,000,000,000 ≤ lo ≤ hi ≤ 1,000,000,000.",
      "A total can exceed 32-bit range; return long / long long.",
    ],
    interface: "Solution.solve(root,lo,hi) returns long / long long.",
    inputSchema: {
      kind: "object",
      properties: { root: rootSchema, lo: integer, hi: integer },
    },
    semanticConstraints: [
      ...common.semanticConstraints,
      { kind: "field-order", lower: "lo", upper: "hi" },
    ],
    valid: (input) => common.valid(input) && input.lo <= input.hi,
    outputSchema: {
      kind: "integer",
      minimum: -2000000000000,
      maximum: 2000000000000,
    },
    function: {
      arguments: [
        { name: "root", type: "TreeNode" },
        { name: "lo", type: "int" },
        { name: "hi", type: "int" },
      ],
      returnType: "long",
      readOnlyNodes: true,
    },
    generate: rangeCases,
    visible: [
      {
        input: { root: [5, 3, 8, 1, 4, 6, 9], lo: 4, hi: 8 },
        expected: 23,
        explanation: "The inclusive keys 4, 5, 6, 8 contribute 23.",
      },
      {
        input: { root: [0, -5, 7, -8, -2], lo: -8, hi: -2 },
        expected: -15,
        explanation: "The matching negative keys -8, -5, -2 total -15.",
      },
      {
        input: { root: [5, 3, 8], lo: 6, hi: 6 },
        expected: 0,
        explanation: "The singleton interval contains no original key.",
      },
    ],
    oracle: rangeTotal,
    independent: rangeIndependent,
    mutations: {
      "exclude-endpoint-keys": (input) => rangeTotal(input, true),
      "signed-int32-range-total": (input) => rangeTotal(input, false, true),
    },
    languages: refs(
      "class Solution {public long solve(TreeNode root,int lo,int hi){long sum=0;ArrayDeque<TreeNode> stack=new ArrayDeque<>();if(root!=null)stack.push(root);while(!stack.isEmpty()){TreeNode n=stack.pop();if(n.val<lo){if(n.right!=null)stack.push(n.right);}else if(n.val>hi){if(n.left!=null)stack.push(n.left);}else{sum+=n.val;if(n.left!=null)stack.push(n.left);if(n.right!=null)stack.push(n.right);}}return sum;}}",
      "class Solution {public:long long solve(TreeNode* root,int lo,int hi){long long sum=0;vector<TreeNode*> stack;if(root)stack.push_back(root);while(!stack.empty()){auto n=stack.back();stack.pop_back();if(n->val<lo){if(n->right)stack.push_back(n->right);}else if(n->val>hi){if(n->left)stack.push_back(n->left);}else{sum+=n->val;if(n->left)stack.push_back(n->left);if(n->right)stack.push_back(n->right);}}return sum;}};",
      "class Solution:\n    def solve(self, root, lo, hi):\n        stack=[] if root is None else [root]\n        total=0\n        while stack:\n            node=stack.pop()\n            if node.val<lo:\n                if node.right is not None:\n                    stack.append(node.right)\n            elif node.val>hi:\n                if node.left is not None:\n                    stack.append(node.left)\n            else:\n                total+=node.val\n                if node.left is not None:\n                    stack.append(node.left)\n                if node.right is not None:\n                    stack.append(node.right)\n        return total\n",
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
      "Trees22/23 source-only author audit; original-node IDs and wide totals, no language reference execution",
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
    "docs/release-evidence/content-trees-bst-rank-range-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-bst-rank-range-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-bst-rank-range.mjs")) audit();
