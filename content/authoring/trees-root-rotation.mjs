import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    queue = [root];
  let at = 1;
  for (const node of queue)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const value = values[at++];
      if (value !== null) {
        node[side] = { val: value, left: null, right: null };
        queue.push(node[side]);
      }
    }
  return root;
}
function encode(root) {
  if (!root) return [];
  const queue = [root],
    out = [];
  for (const node of queue) {
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
function rotate({ root, direction }, dropInner = false) {
  const tree = decode(root);
  if (!tree) return [];
  if (direction === "LEFT") {
    const pivot = tree.right;
    if (!pivot) return encode(tree);
    tree.right = dropInner ? null : pivot.left;
    pivot.left = tree;
    return encode(pivot);
  }
  const pivot = tree.left;
  if (!pivot) return encode(tree);
  tree.left = dropInner ? null : pivot.right;
  pivot.right = tree;
  return encode(pivot);
}
function pathModel({ root, direction }) {
  const tree = decode(root),
    paths = new Map(),
    queue = tree ? [[tree, ""]] : [];
  for (const [node, path] of queue) {
    paths.set(path, node.val);
    if (node.left) queue.push([node.left, path + "L"]);
    if (node.right) queue.push([node.right, path + "R"]);
  }
  if (!paths.size) return [];
  const pivot = direction === "LEFT" ? "R" : "L";
  if (!paths.has(pivot)) return encode(tree);
  const moved = new Map();
  for (const [path, value] of paths) {
    let next;
    if (path === "") next = direction === "LEFT" ? "L" : "R";
    else if (path === pivot) next = "";
    else if (direction === "LEFT") {
      if (path[0] === "L") next = "L" + path;
      else if (path.startsWith("RL")) next = "LR" + path.slice(2);
      else next = path.slice(1);
    } else {
      if (path[0] === "R") next = "R" + path;
      else if (path.startsWith("LR")) next = "RL" + path.slice(2);
      else next = path.slice(1);
    }
    moved.set(next, value);
  }
  const positions = [""],
    out = [];
  for (const path of positions) {
    if (!moved.has(path)) {
      out.push(null);
      continue;
    }
    out.push(moved.get(path));
    positions.push(path + "L", path + "R");
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
function inorder(values) {
  const root = decode(values),
    stack = [],
    out = [];
  let node = root;
  while (node || stack.length) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    out.push(node.val);
    node = node.right;
  }
  return out;
}
const visible = [
  {
    input: { root: [4, 2, 6, 1, 3, 5, 7], direction: "LEFT" },
    expected: [6, 4, 7, 2, 5, null, null, 1, 3],
    explanation:
      "6 becomes the root; its old left subtree rooted at 5 becomes the right child of 4. All other subtrees keep their internal links.",
  },
  {
    input: { root: [2, null, 3], direction: "RIGHT" },
    expected: [2, null, 3],
    explanation:
      "A right rotation needs a left pivot child; none exists, so the tree is unchanged.",
  },
  {
    input: { root: [], direction: "LEFT" },
    expected: [],
    explanation: "The empty native root remains null.",
  },
];
const shapeKey = ({ root, direction }) => {
  const tree = decode(root),
    pivot = direction === "LEFT" ? tree?.right : tree?.left;
  return JSON.stringify({
    shape: root.map((value) => (value === null ? null : 1)),
    operation: pivot ? direction : "UNCHANGED",
  });
};
function chain(n, side) {
  let root = null;
  for (let i = n - 1; i >= 0; i--)
    root = {
      val: i % 3 === 0 ? -1000000000 : i % 3 === 1 ? 0 : 1000000000,
      left: side === "L" ? root : null,
      right: side === "R" ? root : null,
    };
  return encode(root);
}
function complete(n) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    val: (i % 5) - 2,
    left: null,
    right: null,
  }));
  for (let i = 0; i < n; i++) {
    nodes[i].left = nodes[2 * i + 1] ?? null;
    nodes[i].right = nodes[2 * i + 2] ?? null;
  }
  return encode(nodes[0] ?? null);
}
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => shapeKey(c.input)));
  function add(root, direction, category) {
    const input = { root, direction },
      key = shapeKey(input);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ input, category });
    return true;
  }
  for (const direction of ["LEFT", "RIGHT"]) {
    add([0], direction, "zero-valued-singleton-no-pivot");
    add([0, 1], direction, "one-sided-pivot-or-absent-pivot");
    add([0, null, 1], direction, "one-sided-pivot-or-absent-pivot");
    add(
      [0, 1, 2, null, 3, 4, null, 5, null, null, 6],
      direction,
      "inner-subtree-transfer-and-sparse-descendants",
    );
    add(
      [7, 7, 7, 7, null, 7, 7],
      direction,
      "duplicate-values-with-topology-change",
    );
    add([4, 2, 6, 1, 3, 5, 7], direction, "balanced-inner-and-outer-subtrees");
    add(chain(2000, "L"), direction, "maximum-left-chain-pivot-or-noop");
    add(chain(2000, "R"), direction, "maximum-right-chain-pivot-or-noop");
    add(complete(2000), direction, "maximum-wide-tree-with-inner-subtrees");
  }
  for (let n = 3; n <= 24; n++)
    for (const direction of ["LEFT", "RIGHT"])
      add(
        complete(n),
        direction,
        "curated-complete-shape-by-size-and-direction",
      );
  for (let n = 3; n <= 15; n++)
    for (const side of ["L", "R"])
      for (const direction of ["LEFT", "RIGHT"])
        add(
          chain(n, side),
          direction,
          "odd-even-chain-and-absent-pivot-boundary",
        );
  const random = seeded(0x71802);
  let serial = 0;
  while (out.length < 200) {
    const n = 7 + (serial % 43),
      nodes = Array.from({ length: n }, (_, i) => ({
        val: ((random() >>> 12) % 9) - 4,
        left: null,
        right: null,
      })),
      slots = [
        [nodes[0], "left"],
        [nodes[0], "right"],
      ];
    for (let i = 1; i < n; i++) {
      const slot = (random() >>> 12) % slots.length,
        [parent, side] = slots.splice(slot, 1)[0];
      parent[side] = nodes[i];
      slots.push([nodes[i], "left"], [nodes[i], "right"]);
    }
    add(
      encode(nodes[0]),
      serial % 2 ? "LEFT" : "RIGHT",
      "curated-irregular-inner-subtree-and-pivot-shape",
    );
    serial++;
  }
  return out;
}
const integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 },
  treeSchema = {
    kind: "array",
    maxLength: 4001,
    trimTrailingNulls: true,
    items: { kind: "nullable", value: integer },
  },
  fn = {
    arguments: [
      { name: "root", type: "TreeNode" },
      { name: "direction", type: "string" },
    ],
    returnType: "TreeNode",
  },
  starters = buildFunctionStarters(fn);
export const rotationDefinition = {
  id: "trees-18",
  version: "2.0.0",
  slug: "perform-one-specified-native-root-rotation",
  title: "Rotate the root once",
  primaryTopic: "trees",
  step: 2,
  skillIds: [
    "trees.child-links",
    "trees.root-rotation",
    "trees.inorder-preservation",
  ],
  prerequisites: ["trees.child-links"],
  remedialIds: ["trees-01"],
  checkpointIds: ["trees-07", "trees-08"],
  nextIds: ["trees-19", "trees-21"],
  objective:
    "Perform one specified root rotation, preserving the entire inorder value sequence and all unaffected subtree structure.",
  rationale:
    "The pivot child becomes the new root, while its inner subtree moves between the old and new roots. A rotation is a local topology change, not a search or a whole-tree mirror.",
  statement:
    "## Rotate only the root\n\nPerform exactly one rotation in the specified direction. For `LEFT`, the root’s right child becomes the new root. The pivot’s old left subtree becomes the old root’s right subtree, and the old root becomes the pivot’s left child. A `RIGHT` rotation is the mirror rule: the left child becomes the new root, its old right subtree becomes the old root’s left subtree, and the old root becomes the pivot’s right child.\n\nIf the required pivot child does not exist, return the tree unchanged. An empty root returns null. Apply the operation only at the root, not recursively at every node. Every other subtree keeps its internal structure. The entire inorder value sequence is preserved, even for an arbitrary tree that is not a binary search tree.\n\n## Native result contract\n\n`solve(root, direction)` receives a native TreeNode and the string `LEFT` or `RIGHT`. Return a native TreeNode root. You may relink input child pointers or build a new native tree. Grading checks the precise resulting topology and corresponding node values; original node identity and original-input immutability are not required. Do not delete runner-owned input nodes or redeclare the supplied class.\n\n### Representation note\n\nExamples display compact breadth-first values with null child slots. The wrapper constructs native nodes before calling your method and serializes the returned native tree. Return a node, not a serialized array. Duplicate and negative values do not change which links rotate.",
  constraints: [
    "0 ≤ native node count ≤ 2,000.",
    "Every node value lies in [-1,000,000,000,1,000,000,000]; duplicate values are allowed.",
    "The input is a finite arbitrary binary tree; it need not satisfy BST value ordering.",
    "direction is exactly LEFT or RIGHT.",
    "The result must match the specified single-root topology, not merely any tree with the same inorder sequence.",
    "You may relink or allocate a new result; only result values and topology are required, not original identities or immutability.",
  ],
  interface:
    "Solution.solve(root:TreeNode,direction:string) returns a native TreeNode; display output is compact breadth-first values.",
  inputSchema: {
    kind: "object",
    properties: {
      root: treeSchema,
      direction: { kind: "enum", values: ["LEFT", "RIGHT"] },
    },
  },
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  outputSchema: treeSchema,
  function: fn,
  generatorModule: "content/authoring/trees-root-rotation.mjs",
  generate: cases,
  oracle: rotate,
  independent: pathModel,
  visible,
  mutations: {
    "return-original-topology": ({ root }) => root,
    "discard-pivot-inner-subtree": (i) => rotate(i, true),
    "rotate-in-the-opposite-direction": (i) =>
      rotate({ ...i, direction: i.direction === "LEFT" ? "RIGHT" : "LEFT" }),
  },
  languages: {
    java: {
      starter: starters.java,
      reference:
        'class Solution {public TreeNode solve(TreeNode root,String direction){if(root==null)return null;if(direction.equals("LEFT")){TreeNode pivot=root.right;if(pivot==null)return root;root.right=pivot.left;pivot.left=root;return pivot;}TreeNode pivot=root.left;if(pivot==null)return root;root.left=pivot.right;pivot.right=root;return pivot;}}',
    },
    cpp: {
      starter: starters.cpp,
      reference:
        'class Solution {public:TreeNode* solve(TreeNode* root,string direction){if(!root)return nullptr;if(direction=="LEFT"){auto pivot=root->right;if(!pivot)return root;root->right=pivot->left;pivot->left=root;return pivot;}auto pivot=root->left;if(!pivot)return root;root->left=pivot->right;pivot->right=root;return pivot;}};',
    },
    python: {
      starter: starters.python,
      reference:
        'class Solution:\n    def solve(self, root, direction):\n        if root is None:\n            return None\n        if direction=="LEFT":\n            pivot=root.right\n            if pivot is None:\n                return root\n            root.right=pivot.left\n            pivot.left=root\n            return pivot\n        pivot=root.left\n        if pivot is None:\n            return root\n        root.left=pivot.right\n        pivot.right=root\n        return pivot\n',
    },
  },
};
export const definitions = [rotationDefinition];
export function audit() {
  const d = rotationDefinition,
    hidden = logicalCases(d),
    failures = [];
  let inputBytes = 0,
    outputBytes = 0,
    maxNodes = 0;
  for (const c of [...hidden, ...visible]) {
    const expected = d.oracle(c.input);
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input) ||
      !validateInput(d.outputSchema, expected) ||
      !validateSemantics(
        [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
        { root: expected },
      )
    )
      failures.push("schema/semantic rejection");
    if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
      failures.push("independent topology mismatch");
    if (c.expected && JSON.stringify(expected) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (
      JSON.stringify(inorder(c.input.root)) !==
      JSON.stringify(inorder(expected))
    )
      failures.push("inorder changed");
    inputBytes += Buffer.byteLength(JSON.stringify(c.input) + "\n");
    outputBytes += Buffer.byteLength(JSON.stringify(expected) + "\n");
    maxNodes = Math.max(
      maxNodes,
      c.input.root.filter((v) => v !== null).length,
    );
  }
  const structuralIdentities = new Set(hidden.map((c) => shapeKey(c.input)))
    .size;
  if (hidden.length !== 200 || structuralIdentities !== 200)
    failures.push("exact200 structural floor");
  const mutations = Object.entries(d.mutations).map(([name, f]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(f(c.input)) !== JSON.stringify(c.expected),
    ),
  }));
  for (const m of mutations)
    if (!m.detected) failures.push("undetected " + m.name);
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Tree18v2 authored source/schema/independent topology/inorder/mutation audit only; native execution and final publication review pending",
    id: d.id,
    version: d.version,
    hidden: hidden.length,
    visible: 3,
    structuralIdentitiesExcludingValueLabels: structuralIdentities,
    maxNodes,
    inputBytes,
    outputBytes,
    conservativeStdoutBytes: outputBytes + 512 * 203,
    conservativeEnvelopeBytes: 2 * (outputBytes + 512 * 203) + 65536,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-tree18-root-rotation-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-tree18-root-rotation-template-sources.json",
    JSON.stringify(
      { languages: d.languages, wrappers: buildFunctionHarness(d.function) },
      null,
      2,
    ),
  );
  console.log(report);
  if (failures.length) throw Error(JSON.stringify(failures));
  return report;
}
if (process.argv[1]?.endsWith("trees-root-rotation.mjs")) audit();
