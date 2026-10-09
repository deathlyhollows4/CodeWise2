import { definitions as foundation } from "./trees-first.mjs";
import { rotationDefinition } from "./trees-root-rotation.mjs";
import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";

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
function insertNode(root, value) {
  if (!root) return { val: value, left: null, right: null };
  let n = root;
  while (n.val !== value) {
    const side = value < n.val ? "left" : "right";
    if (!n[side]) {
      n[side] = { val: value, left: null, right: null };
      break;
    }
    n = n[side];
  }
  return root;
}
function membership({ root, value }) {
  let n = decode(root);
  while (n) {
    if (n.val === value) return true;
    n = value < n.val ? n.left : n.right;
  }
  return false;
}
function insert({ root, value }, wrongSide = false) {
  let n = decode(root);
  if (!wrongSide) return encode(insertNode(n, value));
  if (!n) return [value];
  let cur = n;
  while (cur.val !== value) {
    const side = value < cur.val ? "right" : "left";
    if (!cur[side]) {
      cur[side] = { val: value, left: null, right: null };
      break;
    }
    cur = cur[side];
  }
  return encode(n);
}
function remove({ root, value }, predecessor = false) {
  const tree = decode(root),
    dummy = { left: tree };
  let parent = dummy,
    n = tree,
    side = "left";
  while (n && n.val !== value) {
    parent = n;
    side = value < n.val ? "left" : "right";
    n = n[side];
  }
  if (!n) return encode(tree);
  if (!n.left || !n.right) parent[side] = n.left || n.right;
  else {
    let p = n,
      s = predecessor ? n.left : n.right,
      link = predecessor ? "left" : "right",
      walk = predecessor ? "right" : "left";
    while (s[walk]) {
      p = s;
      link = walk;
      s = s[walk];
    }
    n.val = s.val;
    p[link] = predecessor ? s.left : s.right;
  }
  return encode(dummy.left);
}
function addressMap(values) {
  const tree = decode(values),
    map = new Map(),
    q = tree ? [[tree, ""]] : [];
  for (const [n, path] of q) {
    map.set(path, n.val);
    if (n.left) q.push([n.left, path + "L"]);
    if (n.right) q.push([n.right, path + "R"]);
  }
  return map;
}
function encodeMap(map) {
  if (!map.has("")) return [];
  const q = [""],
    out = [];
  for (const path of q) {
    if (!map.has(path)) {
      out.push(null);
      continue;
    }
    out.push(map.get(path));
    q.push(path + "L", path + "R");
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
function insertIndependent({ root, value }) {
  const map = addressMap(root);
  let path = "";
  while (map.has(path) && map.get(path) !== value)
    path += value < map.get(path) ? "L" : "R";
  if (!map.has(path)) map.set(path, value);
  return encodeMap(map);
}
function removeIndependent({ root, value }) {
  const map = addressMap(root);
  let path = "";
  while (map.has(path) && map.get(path) !== value)
    path += value < map.get(path) ? "L" : "R";
  if (!map.has(path)) return encodeMap(map);
  const hasL = map.has(path + "L"),
    hasR = map.has(path + "R");
  if (hasL && hasR) {
    let successor = path + "R";
    while (map.has(successor + "L")) successor += "L";
    map.set(path, map.get(successor));
    path = successor;
  }
  const child = map.has(path + "L")
    ? path + "L"
    : map.has(path + "R")
      ? path + "R"
      : null;
  const original = [...map];
  for (const [key] of original) if (key.startsWith(path)) map.delete(key);
  if (child)
    for (const [key, v] of original)
      if (key.startsWith(child)) map.set(path + key.slice(child.length), v);
  return encodeMap(map);
}
function valid({ root }) {
  const tree = decode(root),
    q = tree ? [[tree, -Infinity, Infinity]] : [];
  for (const [n, lo, hi] of q) {
    if (n.val <= lo || n.val >= hi) return false;
    if (n.left) q.push([n.left, lo, n.val]);
    if (n.right) q.push([n.right, n.val, hi]);
  }
  return true;
}
function cases() {
  const rng = seeded(0x7be218),
    out = [];
  for (let test = 0; test < 780; test++) {
    const values = [],
      seen = new Set(),
      n = 2 + (rng() % 80);
    while (values.length < n) {
      const value = (rng() % 2000000001) - 1000000000;
      if (!seen.has(value)) {
        seen.add(value);
        values.push(value);
      }
    }
    if (test % 4 === 0) values.sort((a, b) => a - b);
    else if (test % 4 === 1) values.sort((a, b) => b - a);
    let root = null;
    for (const v of values) root = insertNode(root, v);
    const value =
      test % 3 === 0
        ? values[rng() % values.length]
        : (rng() % 2000000001) - 1000000000;
    out.push({
      input: { root: encode(root), value },
      category:
        test % 3 === 0
          ? "existing-key-native-shape"
          : "absent-key-native-shape",
    });
  }
  for (const root of [
    [],
    [0],
    [5, 3, 8, 1, 4, 6, 9, null, 2, null, null, null, 7],
    [0, -1000000000, 1000000000],
    [10, 5, 20, null, null, 15, 25, null, 17],
  ])
    for (const value of [-1000000000, 0, 1, 5, 10, 15, 17, 20, 1000000000])
      out.push({
        input: { root, value },
        category: "empty-extremes-root-or-successor-right-child",
      });
  for (const reverse of [false, true]) {
    const values = Array.from({ length: 2000 }, (_, i) =>
      reverse ? 1999 - i : i,
    );
    let root = null;
    for (const v of values) root = insertNode(root, v);
    for (const value of [-1, 0, 999, 1999, 2000])
      out.push({
        input: { root: encode(root), value },
        category: "maximum-skew-existing-and-absent",
      });
  }
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const valueSchema = {
    kind: "integer",
    minimum: -1000000000,
    maximum: 1000000000,
  },
  rootSchema = foundation[0].inputSchema.properties.root;
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-bst-updates.mjs",
  inputSchema: {
    kind: "object",
    properties: { root: rootSchema, value: valueSchema },
  },
  semanticConstraints: [
    { kind: "tree-level", field: "root", maxNodes: 2000 },
    { kind: "strict-bst", field: "root" },
  ],
  constraints: [
    "The input has 0 to 2,000 native nodes.",
    "All node values and value lie in [-1,000,000,000,1,000,000,000].",
    "All original values are distinct. Every left subtree value is strictly less than its root and every right subtree value is strictly greater.",
  ],
  valid,
  generate: cases,
  function: {
    arguments: [
      { name: "root", type: "TreeNode" },
      { name: "value", type: "int" },
    ],
    returnType: "TreeNode",
  },
  outputSchema: { ...rootSchema, maxLength: 4003 },
};
const native =
  "## Native interface\n\n`solve(root, value)` receives a genuine TreeNode root and an integer. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and links. Do not redeclare TreeNode or write a parser.\n\nThe input is a strict binary search tree: **all** values in a left subtree are smaller than its root, and **all** values in a right subtree are larger. Values are unique. This promise applies to whole subtrees, not just immediate children.\n\n### Representation note\n\nExamples show compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order. Your arguments are the native root and integer, not these arrays.";
// This preparation contract is independent of the catalogue's current slot18.
// Rank/range tasks must retain ordered unique roots when18 becomes a rotation.
export const strictBstPreparation = {
  inputSchema: common.inputSchema,
  semanticConstraints: common.semanticConstraints,
  valid: common.valid,
  generate: common.generate,
};
export const definitions = [
  {
    ...common,
    id: "trees-18",
    slug: "follow-strict-bst-search-route",
    title: "Search a strict binary search tree",
    step: 2,
    skillIds: ["trees.child-links", "trees.bst-search-route"],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-07", "trees-09", "trees-10"],
    nextIds: ["trees-19"],
    objective:
      "Follow value comparisons through a native ordered tree to decide whether the requested key exists.",
    rationale:
      "The subtree ordering invariant rules out an entire branch after each comparison; null ends an unsuccessful route.",
    statement:
      "## Find an exact key\n\nReturn whether the tree contains a node whose value equals `value`. Follow the strict search-tree ordering to choose the next child. An empty root returns false. Equality at the current node succeeds, including at the root. Preserve every input value and link.\n\n" +
      native,
    interface: "Solution.solve(root,value) returns boolean.",
    outputSchema: { kind: "boolean" },
    function: {
      ...common.function,
      returnType: "boolean",
      readOnlyNodes: true,
    },
    visible: [
      {
        input: { root: [5, 3, 8, 1, 4, 6, 9], value: 6 },
        expected: true,
        explanation:
          "The route goes right from 5, then left from 8, reaching 6.",
      },
      {
        input: { root: [5, 3, 8], value: 4 },
        expected: false,
        explanation: "The route ends at a missing right child of 3.",
      },
      {
        input: { root: [], value: 0 },
        expected: false,
        explanation: "An empty tree contains no key.",
      },
    ],
    oracle: membership,
    independent: ({ root, value }) => root.includes(value),
    mutations: {
      "search-only-left-child": ({ root, value }) => {
        let n = decode(root);
        while (n) {
          if (n.val === value) return true;
          n = n.left;
        }
        return false;
      },
      "stop-at-root": ({ root, value }) => root[0] === value,
    },
    languages: refs(
      "class Solution {public boolean solve(TreeNode root,int value){TreeNode n=root;while(n!=null){if(n.val==value)return true;n=value<n.val?n.left:n.right;}return false;}}",
      "class Solution {public:bool solve(TreeNode* root,int value){while(root){if(root->val==value)return true;root=value<root->val?root->left:root->right;}return false;}};",
      "class Solution:\n    def solve(self, root, value):\n        while root is not None:\n            if root.val==value:\n                return True\n            root=root.left if value<root.val else root.right\n        return False\n",
    ),
  },
  {
    ...common,
    id: "trees-19",
    slug: "insert-unique-key-at-bst-search-leaf",
    title: "Insert at the search route endpoint",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.bst-leaf-insertion",
    ],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01", "trees-18"],
    checkpointIds: ["trees-23", "trees-13", "trees-16"],
    nextIds: ["trees-20"],
    objective:
      "Return the exact tree formed by adding an absent key at its search-route null child, while preserving existing structure.",
    rationale:
      "An insertion changes one child link, or the root for an empty tree; rebalancing would produce the wrong specified shape.",
    statement:
      "## Insert one unique key\n\nReturn the root of the tree after inserting `value`. This question introduces the binary-search-tree route: start at the root, compare the requested key with the current value, and choose the left child for a smaller key or the right child for a larger key. Repeat until you find the key or a null child. If the key already exists, return the same value-and-shape tree without adding a duplicate. Otherwise put the new key at that null child as a leaf. An empty input becomes a singleton. Do not rebalance or relocate existing values: the expected output shape is this exact leaf insertion.\n\nYou may relink the input nodes or return a newly allocated equivalent tree; original-object reuse is not required. The result has at most 2,001 nodes.\n\n" +
      native,
    interface: "Solution.solve(root,value) returns TreeNode.",
    visible: [
      {
        input: { root: [5, 3, 8], value: 4 },
        expected: [5, 3, 8, null, 4],
        explanation:
          "The new leaf becomes the right child of 3; all earlier links stay in their positions.",
      },
      {
        input: { root: [5, 3, 8], value: 5 },
        expected: [5, 3, 8],
        explanation: "The existing root key makes insertion a no-op.",
      },
      {
        input: { root: [], value: -2 },
        expected: [-2],
        explanation:
          "A missing root becomes a singleton with the requested key.",
      },
    ],
    oracle: insert,
    independent: insertIndependent,
    mutations: {
      "reverse-insertion-direction": (input) => insert(input, true),
      "ignore-absent-key": ({ root }) => root,
    },
    languages: refs(
      "class Solution {public TreeNode solve(TreeNode root,int value){if(root==null)return new TreeNode(value);TreeNode n=root;while(n.val!=value){if(value<n.val){if(n.left==null){n.left=new TreeNode(value);break;}n=n.left;}else{if(n.right==null){n.right=new TreeNode(value);break;}n=n.right;}}return root;}}",
      "class Solution {public:TreeNode* solve(TreeNode* root,int value){if(!root)return new TreeNode(value);TreeNode* n=root;while(n->val!=value){if(value<n->val){if(!n->left){n->left=new TreeNode(value);break;}n=n->left;}else{if(!n->right){n->right=new TreeNode(value);break;}n=n->right;}}return root;}};",
      'class Solution:\n    def solve(self, root, value):\n        if root is None:\n            return TreeNode(value)\n        node=root\n        while node.val!=value:\n            side="left" if value<node.val else "right"\n            child=getattr(node,side)\n            if child is None:\n                setattr(node,side,TreeNode(value))\n                break\n            node=child\n        return root\n',
    ),
  },
  {
    ...common,
    id: "trees-20",
    slug: "canonical-successor-bst-deletion",
    title: "Delete a key with the specified successor rule",
    step: 4,
    skillIds: [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.bst-successor-splice",
    ],
    prerequisites: ["trees.child-links", "trees.bst-search-route"],
    remedialIds: ["trees-01", "trees-19"],
    checkpointIds: ["trees-14", "trees-15"],
    nextIds: ["trees-12"],
    objective:
      "Remove one key while preserving the canonical successor-based tree shape, including the successor’s right child.",
    rationale:
      "Deleting a two-child node replaces its value with the smallest right-subtree key and splices that successor rather than discarding its remaining child.",
    statement:
      "## Canonical key deletion\n\nReturn the root after deleting `value`, using these exact rules:\n\n- If the key is absent, preserve the value-and-shape tree.\n- A leaf is replaced by null.\n- A node with one child is replaced by that child.\n- For a node with two children, replace its value with the minimum value from its right subtree, then remove that successor node from its old location. The successor has no left child; its right child, if any, takes its old place.\n\nApply the rules at the root as well as below it. Use the right-subtree successor, not the left-subtree predecessor, so the output shape is deterministic. An empty input remains empty.\n\nYou may relink input nodes or allocate an equivalent result; original-object reuse is not required. Other original values retain the positions prescribed by the rule, with no rebalancing.\n\n" +
      native,
    interface: "Solution.solve(root,value) returns TreeNode.",
    visible: [
      {
        input: {
          root: [5, 3, 8, 1, 4, 6, 9, null, null, null, null, null, 7],
          value: 5,
        },
        expected: [6, 3, 8, 1, 4, 7, 9],
        explanation:
          "Successor 6 replaces root value 5. Its old right child 7 becomes the left child of 8.",
      },
      {
        input: { root: [5, 3, 8], value: 3 },
        expected: [5, null, 8],
        explanation: "The matching left leaf is removed.",
      },
      {
        input: { root: [5, 3, 8], value: 4 },
        expected: [5, 3, 8],
        explanation: "An absent key leaves the tree unchanged.",
      },
    ],
    oracle: remove,
    independent: removeIndependent,
    mutations: {
      "use-predecessor-instead-of-successor": (input) => remove(input, true),
      "drop-whole-matching-subtree": ({ root, value }) => {
        const tree = decode(root),
          dummy = { left: tree };
        let p = dummy,
          n = tree,
          side = "left";
        while (n && n.val !== value) {
          p = n;
          side = value < n.val ? "left" : "right";
          n = n[side];
        }
        if (n) p[side] = null;
        return encode(dummy.left);
      },
    },
    languages: refs(
      "class Solution {public TreeNode solve(TreeNode root,int value){TreeNode dummy=new TreeNode(0);dummy.left=root;TreeNode parent=dummy,n=root;boolean left=true;while(n!=null&&n.val!=value){parent=n;left=value<n.val;n=left?n.left:n.right;}if(n==null)return root;if(n.left==null||n.right==null){TreeNode child=n.left!=null?n.left:n.right;if(left)parent.left=child;else parent.right=child;}else{TreeNode p=n,s=n.right;boolean linkLeft=false;while(s.left!=null){p=s;s=s.left;linkLeft=true;}n.val=s.val;if(linkLeft)p.left=s.right;else p.right=s.right;}return dummy.left;}}",
      "class Solution {public:TreeNode* solve(TreeNode* root,int value){TreeNode dummy(0);dummy.left=root;TreeNode* parent=&dummy;TreeNode* n=root;bool left=true;while(n&&n->val!=value){parent=n;left=value<n->val;n=left?n->left:n->right;}if(!n)return root;if(!n->left||!n->right){TreeNode* child=n->left?n->left:n->right;if(left)parent->left=child;else parent->right=child;}else{TreeNode* p=n;TreeNode* s=n->right;bool linkLeft=false;while(s->left){p=s;s=s->left;linkLeft=true;}n->val=s->val;if(linkLeft)p->left=s->right;else p->right=s->right;}return dummy.left;}};",
      'class Solution:\n    def solve(self, root, value):\n        dummy=TreeNode(0)\n        dummy.left=root\n        parent=dummy\n        node=root\n        side="left"\n        while node is not None and node.val!=value:\n            parent=node\n            side="left" if value<node.val else "right"\n            node=getattr(node,side)\n        if node is None:\n            return root\n        if node.left is None or node.right is None:\n            setattr(parent,side,node.left if node.left is not None else node.right)\n        else:\n            parent=node\n            successor=node.right\n            side="right"\n            while successor.left is not None:\n                parent=successor\n                successor=successor.left\n                side="left"\n            node.val=successor.val\n            setattr(parent,side,successor.right)\n        return dummy.left\n',
    ),
  },
];
// Retired v1 membership source is retained above for authoring history only.
// The exported current slot is the independently distinct v2 rotation task.
definitions[definitions.findIndex(definition => definition.id === "trees-18")] = rotationDefinition;
for (const d of definitions) {
  const starters = buildFunctionStarters(d.function);
  for (const language of ["java", "cpp", "python"])
    d.languages[language].starter = starters[language];
}
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trees18v2 arbitrary-tree rotation and Trees19/20 strict-BST source audit; current runtime guards checked; no native reference execution",
    prepared: [],
    failures: [],
  };
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden]) {
      const expected = d.oracle(c.input);
      if ((d.valid && !d.valid(c.input)) || !validateSemantics(d.semanticConstraints, c.input))
        report.failures.push(d.id + ": invalid declared tree contract");
      if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
        report.failures.push(d.id + ": independent mismatch");
      if (
        c.expected !== undefined &&
        JSON.stringify(expected) !== JSON.stringify(c.expected)
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
      visible: d.visible.length,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-trees-bst-updates-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-bst-updates-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-bst-updates.mjs")) audit();

