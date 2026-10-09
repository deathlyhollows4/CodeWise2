import { materializePack, logicalCases, seeded } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 };
const inputSchema = {
  kind: "object",
  properties: {
    root: {
      kind: "array",
      maxLength: 4001,
      trimTrailingNulls: true,
      items: { kind: "nullable", value: integer },
    },
  },
};
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    queue = [root];
  let cursor = 1;
  for (let i = 0; i < queue.length && cursor < values.length; i++)
    for (const side of ["left", "right"]) {
      if (cursor >= values.length) break;
      const value = values[cursor++];
      if (value !== null) {
        queue[i][side] = { val: value, left: null, right: null };
        queue.push(queue[i][side]);
      }
    }
  return root;
}
function encode(root) {
  if (!root) return [];
  const queue = [root],
    out = [];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (!node) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left, node.right);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
function topology(values) {
  if (!values.length) return new Map();
  const map = new Map([[0, { left: null, right: null }]]),
    queue = [0];
  let cursor = 1;
  for (let i = 0; i < queue.length; i++)
    for (const side of ["left", "right"]) {
      if (cursor >= values.length) break;
      const index = cursor++;
      if (values[index] !== null) {
        map.get(queue[i])[side] = index;
        map.set(index, { left: null, right: null });
        queue.push(index);
      }
    }
  return map;
}
function chain(length, right = false) {
  let root = null;
  for (let i = length - 1; i >= 0; i--)
    root = {
      val: i % 5 === 0 ? -1000000000 : i % 3,
      left: right ? null : root,
      right: right ? root : null,
    };
  return encode(root);
}
function generated(seed) {
  const r = seeded(seed),
    cases = [];
  for (let t = 0; t < 700; t++) {
    const n = (r() >>> 8) % 80;
    if (!n) {
      cases.push({ input: { root: [] }, category: "empty-tree" });
      continue;
    }
    const root = { val: ((r() >>> 8) % 31) - 15, left: null, right: null },
      slots = [
        { node: root, side: "left" },
        { node: root, side: "right" },
      ];
    for (let i = 1; i < n; i++) {
      const j = (r() >>> 8) % slots.length,
        { node, side } = slots.splice(j, 1)[0],
        child = {
          val: t % 7 === 0 ? -7 : ((r() >>> 8) % 31) - 15,
          left: null,
          right: null,
        };
      node[side] = child;
      slots.push({ node: child, side: "left" }, { node: child, side: "right" });
    }
    cases.push({
      input: { root: encode(root) },
      category:
        t % 7 === 0
          ? "duplicate-negative-values-sparse-shape"
          : "varied-branching-and-sparse-shape",
    });
  }
  for (let n = 1; n <= 220; n++) {
    cases.push(
      { input: { root: chain(n, false) }, category: "left-depth-spectrum" },
      { input: { root: chain(n, true) }, category: "right-depth-spectrum" },
    );
  }
  cases.push(
    { input: { root: chain(2000, false) }, category: "deep-2000-native-nodes" },
    {
      input: { root: Array(2000).fill(1000000000) },
      category: "wide-2000-positive-nodes",
    },
    {
      input: { root: Array(2000).fill(-1000000000) },
      category: "wide-2000-negative-nodes",
    },
  );
  return cases;
}
const count = ({ root }) => root.filter((v) => v !== null).length;
const countWalk = ({ root }) => {
  const tree = decode(root),
    stack = tree ? [tree] : [];
  let n = 0;
  while (stack.length) {
    const node = stack.pop();
    n++;
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }
  return n;
};
const leafSum = ({ root }) => {
  const tree = decode(root),
    stack = tree ? [tree] : [];
  let total = 0;
  while (stack.length) {
    const node = stack.pop();
    if (!node.left && !node.right) total += node.val;
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }
  return total;
};
const leafFlat = ({ root }) => {
  let result = 0;
  for (const [id, children] of topology(root))
    if (children.left === null && children.right === null) result += root[id];
  return result;
};
const height = ({ root }) => {
  const tree = decode(root),
    stack = tree ? [[tree, 1]] : [];
  let longest = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    longest = Math.max(longest, depth);
    if (node.left) stack.push([node.left, depth + 1]);
    if (node.right) stack.push([node.right, depth + 1]);
  }
  return longest;
};
const heightLevels = ({ root }) => {
  if (!root.length) return 0;
  const map = topology(root);
  let level = [0],
    depth = 0;
  while (level.length) {
    depth++;
    const next = [];
    for (const id of level) {
      const node = map.get(id);
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }
    level = next;
  }
  return depth;
};
const preorder = ({ root }) => {
  const tree = decode(root),
    stack = tree ? [tree] : [],
    out = [];
  while (stack.length) {
    const node = stack.pop();
    out.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return out;
};
const preorderFrames = ({ root }) => {
  if (!root.length) return [];
  const map = topology(root),
    frames = [[0, 0]],
    out = [];
  while (frames.length) {
    const [id, state] = frames.pop(),
      node = map.get(id);
    if (state === 0) {
      out.push(root[id]);
      frames.push([id, 1]);
      if (node.left !== null) frames.push([node.left, 0]);
    } else if (node.right !== null) frames.push([node.right, 0]);
  }
  return out;
};
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-first.mjs",
  inputSchema,
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "int",
    readOnlyNodes: true,
  },
  constraints: [
    "0 ≤ native node count ≤ 2,000.",
    "Node values lie in [-1,000,000,000,1,000,000,000].",
    "The input is a finite binary tree; sparse children, duplicate values and deep chains are allowed.",
    "Do not modify original node values or links.",
  ],
  prerequisites: ["arrays.traversal"],
  step: 1,
};
const nativeNote =
  "## Native interface\n\nYour function receives a TreeNode root or null. A node has `val`, `left`, and `right`; missing children are null. The runner supplies the class and builds native links. Do not redeclare it, write a parser, delete input nodes, or change original values/links.\n\n### Representation note\n\nExamples display compact breadth-first values, using null for missing child slots and omitting trailing nulls. This is not heap-index numbering: children are read for existing parents in queue order. Your function receives actual nodes, not the displayed array.";
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
export const definitions = [
  {
    ...common,
    id: "trees-01",
    slug: "count-native-binary-tree-nodes",
    title: "Count the nodes in the tree",
    skillIds: ["trees.child-links", "trees.node-visitation"],
    checkpointIds: ["trees-02"],
    remedialIds: ["arrays-hashing-01"],
    nextIds: ["trees-03"],
    objective:
      "Visit native child links and count each existing binary-tree node once.",
    rationale:
      "Missing child positions are not nodes, and duplicate node values do not merge identities.",
    statement:
      "## Count the nodes\n\nReturn the number of existing nodes in the binary tree. A missing child contributes nothing. Count two different nodes separately even when they contain the same value. An empty tree has count 0.\n\n" +
      nativeNote,
    interface: "Solution.solve(root) receives TreeNode and returns int.",
    outputSchema: { kind: "integer", minimum: 0, maximum: 2000 },
    visible: [
      {
        input: { root: [4, null, 7, 9] },
        expected: 3,
        explanation:
          "The root, its right child, and that child's left child are three nodes.",
      },
      {
        input: { root: [5] },
        expected: 1,
        explanation: "A singleton contains one existing node.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "An empty representation builds a null root.",
      },
    ],
    generate: () => generated(0x7ee1),
    oracle: count,
    independent: countWalk,
    mutations: {
      "count-null-slots": ({ root }) => root.length,
      "ignore-right-subtrees": ({ root }) => {
        let node = decode(root),
          n = 0;
        while (node) {
          n++;
          node = node.left;
        }
        return n;
      },
    },
    languages: refs(
      "class Solution {public int solve(TreeNode root){if(root==null)return 0;ArrayDeque<TreeNode> stack=new ArrayDeque<>();stack.push(root);int count=0;while(!stack.isEmpty()){TreeNode node=stack.pop();count++;if(node.left!=null)stack.push(node.left);if(node.right!=null)stack.push(node.right);}return count;}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> stack{root};int count=0;while(!stack.empty()){auto node=stack.back();stack.pop_back();count++;if(node->left)stack.push_back(node->left);if(node->right)stack.push_back(node->right);}return count;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [root]\n        count=0\n        while stack:\n            node=stack.pop()\n            count+=1\n            if node.left is not None:\n                stack.append(node.left)\n            if node.right is not None:\n                stack.append(node.right)\n        return count\n",
    ),
  },
  {
    ...common,
    id: "trees-02",
    slug: "sum-native-leaf-values",
    title: "Total the leaf values",
    skillIds: [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.leaf-value-aggregate",
    ],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-01"],
    remedialIds: ["trees-01"],
    nextIds: ["trees-03"],
    objective:
      "Recognize nodes with neither child and sum only their signed values using a wide accumulator.",
    rationale:
      "An internal node is excluded even if one child is missing; negative leaf values must still contribute.",
    statement:
      "## Add only the leaves\n\nA leaf has neither a left child nor a right child. Return the sum of values in leaf nodes only. Ignore internal-node values. An empty tree has total 0; a singleton is itself a leaf, including when its value is negative. Use a wide integer accumulator for the total.\n\n" +
      nativeNote,
    interface:
      "Solution.solve(root) receives TreeNode and returns long / long long / Python int.",
    outputSchema: {
      kind: "integer",
      minimum: -2000000000000,
      maximum: 2000000000000,
    },
    function: { ...common.function, returnType: "long" },
    visible: [
      {
        input: { root: [10, 3, -4, null, 2] },
        expected: -2,
        explanation:
          "The leaves contain 2 and -4; internal values 10 and 3 are excluded.",
      },
      {
        input: { root: [-7] },
        expected: -7,
        explanation:
          "A negative singleton is a leaf and contributes its value.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "No leaf means a zero total.",
      },
    ],
    generate: () => generated(0x7ee2),
    oracle: leafSum,
    independent: leafFlat,
    mutations: {
      "sum-all-existing-nodes": ({ root }) =>
        root.reduce((sum, v) => sum + (v ?? 0), 0),
      "drop-negative-leaves": ({ root }) => {
        const map = topology(root);
        let sum = 0;
        for (const [id, n] of map)
          if (n.left === null && n.right === null) sum += Math.max(0, root[id]);
        return sum;
      },
    },
    languages: refs(
      "class Solution {public long solve(TreeNode root){if(root==null)return 0L;ArrayDeque<TreeNode> stack=new ArrayDeque<>();stack.push(root);long total=0;while(!stack.isEmpty()){TreeNode node=stack.pop();if(node.left==null&&node.right==null)total+=node.val;if(node.left!=null)stack.push(node.left);if(node.right!=null)stack.push(node.right);}return total;}}",
      "class Solution {public:long long solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> stack{root};long long total=0;while(!stack.empty()){auto node=stack.back();stack.pop_back();if(!node->left&&!node->right)total+=node->val;if(node->left)stack.push_back(node->left);if(node->right)stack.push_back(node->right);}return total;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [root]\n        total=0\n        while stack:\n            node=stack.pop()\n            if node.left is None and node.right is None:\n                total+=node.val\n            if node.left is not None:\n                stack.append(node.left)\n            if node.right is not None:\n                stack.append(node.right)\n        return total\n",
    ),
  },
  {
    ...common,
    id: "trees-03",
    slug: "height-in-native-tree-nodes",
    title: "Measure the longest root-to-leaf route",
    step: 2,
    skillIds: ["trees.depth-tracking", "trees.null-baseline"],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-04"],
    remedialIds: ["trees-01", "trees-02"],
    nextIds: [],
    objective:
      "Compute the greatest number of nodes on a root-to-leaf route, handling skewed and sparse trees.",
    rationale:
      "Height combines branch depths rather than the total node count; define the empty baseline and singleton convention explicitly.",
    statement:
      "## Measure the height\n\nReturn the largest number of nodes on any route from the root to a leaf. Count the root and the leaf. An empty tree has height 0; a singleton has height 1. Node values do not affect height. A route follows child links, and one long branch must not be averaged with a shorter branch.\n\n" +
      nativeNote,
    interface: "Solution.solve(root) receives TreeNode and returns int.",
    outputSchema: { kind: "integer", minimum: 0, maximum: 2000 },
    visible: [
      {
        input: { root: [1, null, 2, null, 3] },
        expected: 3,
        explanation: "The three nodes form one rightward route.",
      },
      {
        input: { root: [9] },
        expected: 1,
        explanation: "The only route contains the root itself.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "An empty tree has no route.",
      },
    ],
    generate: () => generated(0x7ee3),
    oracle: height,
    independent: heightLevels,
    mutations: {
      "count-edges-instead-of-nodes": (input) => Math.max(0, height(input) - 1),
      "only-leftward-depth": ({ root }) => {
        let node = decode(root),
          n = 0;
        while (node) {
          n++;
          node = node.left;
        }
        return n;
      },
    },
    languages: refs(
      "class Solution {public int solve(TreeNode root){if(root==null)return 0;ArrayDeque<TreeNode> queue=new ArrayDeque<>();queue.add(root);int depth=0;while(!queue.isEmpty()){int count=queue.size();depth++;for(int i=0;i<count;i++){TreeNode node=queue.remove();if(node.left!=null)queue.add(node.left);if(node.right!=null)queue.add(node.right);}}return depth;}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;queue<TreeNode*> nodes;nodes.push(root);int depth=0;while(!nodes.empty()){int count=nodes.size();depth++;for(int i=0;i<count;i++){auto node=nodes.front();nodes.pop();if(node->left)nodes.push(node->left);if(node->right)nodes.push(node->right);}}return depth;}};",
      "class Solution:\n    def solve(self, root):\n        level=[] if root is None else [root]\n        depth=0\n        while level:\n            depth+=1\n            following=[]\n            for node in level:\n                if node.left is not None:\n                    following.append(node.left)\n                if node.right is not None:\n                    following.append(node.right)\n            level=following\n        return depth\n",
    ),
  },
  {
    ...common,
    id: "trees-04",
    slug: "native-preorder-visit-values",
    title: "Visit root, then left, then right",
    step: 2,
    skillIds: ["trees.preorder-order", "trees.explicit-stack-order"],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-03"],
    remedialIds: ["trees-01", "trees-02"],
    nextIds: [],
    objective:
      "Produce preorder values from native child links while preserving duplicate visits and left-before-right ordering.",
    rationale:
      "The displayed input uses breadth-first construction, so returning the input values does not produce the required depth-first order.",
    statement:
      "## Visit in preorder\n\nReturn the values in preorder: visit the current node, then its entire left subtree, then its entire right subtree. Apply that rule at every node. Preserve repeated values because different nodes each produce one visit. An empty tree returns an empty native array/list.\n\n" +
      nativeNote,
    interface:
      "Solution.solve(root) receives TreeNode and returns int[] / vector<int> / Python list[int].",
    outputSchema: { kind: "array", maxLength: 2000, items: integer },
    function: { ...common.function, returnType: "int[]" },
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5, null, 6] },
        expected: [1, 2, 4, 5, 3, 6],
        explanation:
          "Finish the whole subtree at 2 before visiting the subtree at 3.",
      },
      {
        input: { root: [-2, null, -3, -4] },
        expected: [-2, -3, -4],
        explanation:
          "Sparse child positions are skipped; existing nodes retain preorder.",
      },
      {
        input: { root: [] },
        expected: [],
        explanation: "A null root produces no visited value.",
      },
    ],
    generate: () => generated(0x7ee4),
    oracle: preorder,
    independent: preorderFrames,
    mutations: {
      "breadth-first-values": ({ root }) => root.filter((v) => v !== null),
      "postorder-instead": ({ root }) => {
        const tree = decode(root),
          stack = tree ? [[tree, false]] : [],
          out = [];
        while (stack.length) {
          const [node, done] = stack.pop();
          if (done) {
            out.push(node.val);
            continue;
          }
          stack.push([node, true]);
          if (node.right) stack.push([node.right, false]);
          if (node.left) stack.push([node.left, false]);
        }
        return out;
      },
    },
    languages: refs(
      "class Solution {public int[] solve(TreeNode root){ArrayList<Integer> values=new ArrayList<>();ArrayDeque<TreeNode> stack=new ArrayDeque<>();if(root!=null)stack.push(root);while(!stack.isEmpty()){TreeNode node=stack.pop();values.add(node.val);if(node.right!=null)stack.push(node.right);if(node.left!=null)stack.push(node.left);}return values.stream().mapToInt(Integer::intValue).toArray();}}",
      "class Solution {public:vector<int> solve(TreeNode* root){vector<int> out;vector<TreeNode*> stack;if(root)stack.push_back(root);while(!stack.empty()){auto node=stack.back();stack.pop_back();out.push_back(node->val);if(node->right)stack.push_back(node->right);if(node->left)stack.push_back(node->left);}return out;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [root]\n        values=[]\n        while stack:\n            node=stack.pop()\n            values.append(node.val)\n            if node.right is not None:\n                stack.append(node.right)\n            if node.left is not None:\n                stack.append(node.left)\n        return values\n",
    ),
  },
];
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trees01–04 draft canonical cases and independent trusted JS oracle/mutation checks",
    referenceRuntime: "not-run",
    published: 0,
    packs: [],
    failures: [],
  };
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden])
      if (
        JSON.stringify(d.oracle(c.input)) !==
        JSON.stringify(d.independent(c.input))
      )
        report.failures.push(d.id + ": oracle mismatch");
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(d.id + ": live mutation " + m.name);
    report.packs.push({
      id: d.id,
      hidden: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-trees-first-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("trees-first.mjs")) {
  for (const d of definitions) console.log(await materializePack(d));
  audit();
}
