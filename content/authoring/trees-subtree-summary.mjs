import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
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
function postorder(root) {
  const order = [],
    stack = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop();
    order.push(n);
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return order.reverse();
}
function height(root) {
  if (!root) return 0;
  const queue = [[root, 1]];
  let result = 0;
  for (const [node, depth] of queue) {
    result = Math.max(result, depth);
    if (node.left) queue.push([node.left, depth + 1]);
    if (node.right) queue.push([node.right, depth + 1]);
  }
  return result;
}
function balanced({ root }, onlyRoot = false) {
  const tree = decode(root),
    heights = new Map();
  let okay = true;
  for (const n of postorder(tree)) {
    const a = heights.get(n.left) || 0,
      b = heights.get(n.right) || 0;
    heights.set(n, 1 + Math.max(a, b));
    if ((!onlyRoot || n === tree) && Math.abs(a - b) > 1) okay = false;
  }
  return okay;
}
function balancedIndependent({ root }) {
  for (const n of postorder(decode(root)))
    if (Math.abs(height(n.left) - height(n.right)) > 1) return false;
  return true;
}
function diameter({ root }) {
  const heights = new Map();
  let best = 0;
  for (const n of postorder(decode(root))) {
    const a = heights.get(n.left) || 0,
      b = heights.get(n.right) || 0;
    best = Math.max(best, a + b);
    heights.set(n, 1 + Math.max(a, b));
  }
  return best;
}
function diameterIndependent({ root }) {
  const tree = decode(root);
  if (!tree) return 0;
  const edges = new Map(),
    queue = [tree];
  for (const n of queue) {
    if (!edges.has(n)) edges.set(n, []);
    for (const child of [n.left, n.right])
      if (child) {
        edges.get(n).push(child);
        edges.set(child, [n]);
        queue.push(child);
      }
  }
  const farthest = (start) => {
    const q = [[start, null, 0]];
    let far = q[0];
    for (const item of q) {
      const [n, parent, d] = item;
      if (d > far[2]) far = item;
      for (const next of edges.get(n))
        if (next !== parent) q.push([next, n, d + 1]);
    }
    return far;
  };
  return farthest(farthest(tree)[0])[2];
}
function duplicateTypes({ root }, occurrences = false, leavesOnly = false) {
  const ids = new Map(),
    interning = new Map(),
    counts = new Map();
  let result = 0;
  for (const n of postorder(decode(root))) {
    const key = JSON.stringify([
      n.val,
      ids.get(n.left) || 0,
      ids.get(n.right) || 0,
    ]);
    if (!interning.has(key)) interning.set(key, interning.size + 1);
    const id = interning.get(key);
    ids.set(n, id);
    if (leavesOnly && (n.left || n.right)) continue;
    const count = (counts.get(id) || 0) + 1;
    counts.set(id, count);
    if (occurrences ? count > 1 : count === 2) result++;
  }
  return result;
}
function duplicateIndependent({ root }) {
  const encoded = new Map(),
    frequency = new Map();
  for (const n of postorder(decode(root))) {
    const key =
      "(" +
      String(n.val) +
      "," +
      (encoded.get(n.left) || "#") +
      "," +
      (encoded.get(n.right) || "#") +
      ")";
    encoded.set(n, key);
    frequency.set(key, (frequency.get(key) || 0) + 1);
  }
  return [...frequency.values()].filter((n) => n >= 2).length;
}
function ancestorMaximum({ root }, strict = false, parentOnly = false) {
  const tree = decode(root),
    stack = tree ? [[tree, -Infinity]] : [];
  let count = 0;
  while (stack.length) {
    const [n, max] = stack.pop();
    if (strict ? n.val > max : n.val >= max) count++;
    const next = parentOnly ? n.val : Math.max(max, n.val);
    if (n.left) stack.push([n.left, next]);
    if (n.right) stack.push([n.right, next]);
  }
  return count;
}
function ancestorIndependent({ root }) {
  const tree = decode(root);
  if (!tree) return 0;
  const queue = [tree],
    parents = new Map([[tree, null]]);
  let count = 0;
  for (const n of queue) {
    let okay = true;
    for (let p = parents.get(n); p; p = parents.get(p))
      if (p.val > n.val) {
        okay = false;
        break;
      }
    if (okay) count++;
    for (const child of [n.left, n.right])
      if (child) {
        parents.set(child, n);
        queue.push(child);
      }
  }
  return count;
}
function cases() {
  const out = foundation[0]
    .generate()
    .map((c) => ({ input: { root: [...c.input.root] }, category: c.category }));
  for (let size = 3; size <= 255; size += 2) {
    out.push({
      input: { root: Array(size).fill(1) },
      category: "repeated-complete-subtree-types",
    });
    out.push({
      input: { root: Array.from({ length: size }, (_, i) => (i % 3) - 1) },
      category: "duplicate-values-with-shape-boundaries",
    });
  }
  for (const root of [
    [1, 2, 3, 4, null, null, 5, 6, null, null, 7],
    [5, 2, 6, 4],
    [7, 7, 7, 7, 7, 7, 7],
    [1, 2, 3, 4, null, 2, 4, null, null, 4],
    [0, -1, -2, -3, -4, -5, -6],
  ])
    out.push({
      input: { root },
      category: "targeted-subtree-or-ancestor-counterexample",
    });
  return out;
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-subtree-summary.mjs",
  inputSchema: foundation[0].inputSchema,
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  constraints: foundation[0].constraints,
  outputSchema: { kind: "integer", minimum: 0, maximum: 2000 },
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "int",
    readOnlyNodes: true,
  },
  generate: cases,
};
const native =
  "## Native interface\n\n`solve(root)` receives a genuine TreeNode root. Each node has `val`, `left`, and `right`; missing children and an empty root are null. The runner supplies the class and constructs the tree. Do not redeclare TreeNode, parse the example representation, or change input values or links.\n\n### Representation note\n\nExamples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are consumed for existing parents in queue order. These arrays describe the native input; they are not your function argument.";
export const definitions = [
  {
    ...common,
    id: "trees-13",
    slug: "every-subtree-height-balance",
    title: "Check balance at every subtree",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.subtree-height-summary",
      "trees.local-balance-invariant",
    ],
    prerequisites: ["trees.child-links", "trees.depth-tracking"],
    remedialIds: ["trees-01", "trees-03"],
    checkpointIds: ["trees-05", "trees-06", "trees-11", "trees-16"],
    nextIds: ["trees-14", "trees-15"],
    objective:
      "Verify that the two child subtree heights differ by at most one at every node.",
    rationale:
      "Root balance alone can hide an unbalanced descendant; bottom-up child summaries make every local check explicit.",
    statement:
      "## Every subtree must be balanced\n\nReturn true when every node has left and right subtree heights differing by at most one. Height counts nodes: an empty child has height zero and a leaf has height one. Check all nodes, not just the root. Values do not affect the answer. Empty and singleton trees are balanced.\n\n" +
      native,
    interface: "Solution.solve(root) returns boolean.",
    outputSchema: { kind: "boolean" },
    function: { ...common.function, returnType: "boolean" },
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5] },
        expected: true,
        explanation: "Both child heights differ by at most one at every node.",
      },
      {
        input: { root: [1, 2, 3, 4, null, null, 5, 6, null, null, 7] },
        expected: false,
        explanation:
          "The root has equal child heights, but its two children each contain an imbalance.",
      },
      {
        input: { root: [] },
        expected: true,
        explanation: "There is no node violating the balance rule.",
      },
    ],
    oracle: balanced,
    independent: balancedIndependent,
    mutations: {
      "check-only-root": (input) => balanced(input, true),
      "require-equal-child-heights": ({ root }) => {
        const h = new Map();
        for (const n of postorder(decode(root))) {
          const a = h.get(n.left) || 0,
            b = h.get(n.right) || 0;
          if (a !== b) return false;
          h.set(n, 1 + a);
        }
        return true;
      },
    },
    languages: refs(
      "class Solution {public boolean solve(TreeNode root){if(root==null)return true;ArrayList<TreeNode> order=new ArrayList<>();order.add(root);for(int i=0;i<order.size();i++){TreeNode n=order.get(i);if(n.left!=null)order.add(n.left);if(n.right!=null)order.add(n.right);}IdentityHashMap<TreeNode,Integer> height=new IdentityHashMap<>();for(int i=order.size()-1;i>=0;i--){TreeNode n=order.get(i);int a=n.left==null?0:height.get(n.left),b=n.right==null?0:height.get(n.right);if(Math.abs(a-b)>1)return false;height.put(n,1+Math.max(a,b));}return true;}}",
      "class Solution {public:bool solve(TreeNode* root){if(!root)return true;vector<TreeNode*> order{root};for(size_t i=0;i<order.size();i++){auto n=order[i];if(n->left)order.push_back(n->left);if(n->right)order.push_back(n->right);}unordered_map<TreeNode*,int> height;for(auto i=order.rbegin();i!=order.rend();++i){auto n=*i;int a=n->left?height.at(n->left):0,b=n->right?height.at(n->right):0;if(abs(a-b)>1)return false;height[n]=1+max(a,b);}return true;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return True\n        order=[root]\n        for node in order:\n            if node.left is not None:\n                order.append(node.left)\n            if node.right is not None:\n                order.append(node.right)\n        heights={}\n        for node in reversed(order):\n            a=0 if node.left is None else heights[node.left]\n            b=0 if node.right is None else heights[node.right]\n            if abs(a-b)>1:\n                return False\n            heights[node]=1+max(a,b)\n        return True\n",
    ),
  },
  {
    ...common,
    id: "trees-14",
    slug: "longest-path-between-arbitrary-tree-nodes",
    title: "Measure the longest path across the tree",
    step: 4,
    skillIds: [
      "trees.child-links",
      "trees.subtree-height-summary",
      "trees.two-arm-path-join",
    ],
    prerequisites: ["trees.child-links", "trees.subtree-height-summary"],
    remedialIds: ["trees-01", "trees-13"],
    checkpointIds: ["trees-15"],
    nextIds: ["trees-12"],
    objective:
      "Find the largest number of edges on any simple path between two native nodes.",
    rationale:
      "The longest path may join two child branches below the root; a root-to-leaf height alone is insufficient.",
    statement:
      "## Longest path between any two nodes\n\nReturn the maximum number of edges on a simple path between any two nodes. The endpoints may be internal nodes or leaves, and the path need not pass through the root. Count edges, not nodes. An empty tree and a singleton return zero. Node values do not affect path length.\n\n" +
      native,
    interface: "Solution.solve(root) returns int.",
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5] },
        expected: 3,
        explanation: "The path 4 → 2 → 1 → 3 uses three edges.",
      },
      {
        input: { root: [8, 9, null, 10] },
        expected: 2,
        explanation: "The three-node chain contains two edges.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "An empty tree has no edge.",
      },
    ],
    oracle: diameter,
    independent: diameterIndependent,
    mutations: {
      "return-root-height": ({ root }) => height(decode(root)),
      "root-only-two-arm-path": ({ root }) => {
        const n = decode(root);
        return n ? height(n.left) + height(n.right) : 0;
      },
    },
    languages: refs(
      "class Solution {public int solve(TreeNode root){if(root==null)return 0;ArrayList<TreeNode> order=new ArrayList<>();order.add(root);for(int i=0;i<order.size();i++){TreeNode n=order.get(i);if(n.left!=null)order.add(n.left);if(n.right!=null)order.add(n.right);}IdentityHashMap<TreeNode,Integer> height=new IdentityHashMap<>();int best=0;for(int i=order.size()-1;i>=0;i--){TreeNode n=order.get(i);int a=n.left==null?0:height.get(n.left),b=n.right==null?0:height.get(n.right);best=Math.max(best,a+b);height.put(n,1+Math.max(a,b));}return best;}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> order{root};for(size_t i=0;i<order.size();i++){auto n=order[i];if(n->left)order.push_back(n->left);if(n->right)order.push_back(n->right);}unordered_map<TreeNode*,int> height;int best=0;for(auto i=order.rbegin();i!=order.rend();++i){auto n=*i;int a=n->left?height.at(n->left):0,b=n->right?height.at(n->right):0;best=max(best,a+b);height[n]=1+max(a,b);}return best;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return 0\n        order=[root]\n        for node in order:\n            if node.left is not None:\n                order.append(node.left)\n            if node.right is not None:\n                order.append(node.right)\n        heights={}\n        best=0\n        for node in reversed(order):\n            a=0 if node.left is None else heights[node.left]\n            b=0 if node.right is None else heights[node.right]\n            best=max(best,a+b)\n            heights[node]=1+max(a,b)\n        return best\n",
    ),
  },
  {
    ...common,
    id: "trees-15",
    slug: "count-repeated-value-and-shape-subtree-types",
    title: "Count repeated subtree types",
    step: 4,
    skillIds: [
      "trees.child-links",
      "trees.structural-interning",
      "hashing.membership",
      "trees.subtree-type-frequency",
    ],
    prerequisites: ["trees.child-links", "hashing.membership"],
    remedialIds: ["trees-01", "arrays-hashing-03"],
    checkpointIds: ["trees-14"],
    nextIds: ["trees-12"],
    objective:
      "Count distinct complete rooted subtree types, including both values and child orientation, that occur at least twice.",
    rationale:
      "Interning value/left-type/right-type summaries distinguishes structure from a value multiset and counts each repeated type once.",
    statement:
      "## Repeated subtree types\n\nEvery node roots a subtree containing that node and all its descendants. Two such subtrees have the same type when their root values agree and their corresponding left and right child subtrees have the same types; null children must match. Count how many distinct types occur at two or more original nodes. Count each qualifying type once, even when it occurs three or more times. Leaves are valid subtree types. Null is not a type to count. An empty tree returns zero.\n\nEqual values alone do not establish equal subtrees, and exchanging left and right children changes a type unless those two child types are already equal.\n\n" +
      native,
    interface: "Solution.solve(root) returns int.",
    visible: [
      {
        input: { root: [1, 2, 3, 4, null, 2, 4, null, null, 4] },
        expected: 2,
        explanation:
          "The leaf type 4 occurs three times; the type rooted at 2 with left child 4 occurs twice. Each type contributes one.",
      },
      {
        input: { root: [7, 7, 7, 7, 7, 7, 7] },
        expected: 2,
        explanation:
          "The leaf type occurs four times and the height-two full subtree type occurs twice.",
      },
      {
        input: { root: [1, 2, 3] },
        expected: 0,
        explanation: "All three rooted subtree types are different.",
      },
    ],
    oracle: duplicateTypes,
    independent: duplicateIndependent,
    mutations: {
      "count-extra-occurrences-not-types": (input) =>
        duplicateTypes(input, true),
      "count-only-repeated-leaf-types": (input) =>
        duplicateTypes(input, false, true),
    },
    languages: refs(
      'class Solution {public int solve(TreeNode root){if(root==null)return 0;ArrayList<TreeNode> order=new ArrayList<>();order.add(root);for(int i=0;i<order.size();i++){TreeNode n=order.get(i);if(n.left!=null)order.add(n.left);if(n.right!=null)order.add(n.right);}IdentityHashMap<TreeNode,Integer> ids=new IdentityHashMap<>();HashMap<String,Integer> types=new HashMap<>();HashMap<Integer,Integer> counts=new HashMap<>();int result=0;for(int i=order.size()-1;i>=0;i--){TreeNode n=order.get(i);int a=n.left==null?0:ids.get(n.left),b=n.right==null?0:ids.get(n.right);String key=n.val+","+a+","+b;Integer id=types.get(key);if(id==null){id=types.size()+1;types.put(key,id);}ids.put(n,id);int count=counts.getOrDefault(id,0)+1;counts.put(id,count);if(count==2)result++;}return result;}}',
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> order{root};for(size_t i=0;i<order.size();i++){auto n=order[i];if(n->left)order.push_back(n->left);if(n->right)order.push_back(n->right);}unordered_map<TreeNode*,int> ids;map<tuple<int,int,int>,int> types;unordered_map<int,int> counts;int result=0;for(auto i=order.rbegin();i!=order.rend();++i){auto n=*i;int a=n->left?ids.at(n->left):0,b=n->right?ids.at(n->right):0;auto key=make_tuple(n->val,a,b);auto found=types.find(key);int id;if(found==types.end()){id=(int)types.size()+1;types[key]=id;}else id=found->second;ids[n]=id;if(++counts[id]==2)result++;}return result;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return 0\n        order=[root]\n        for node in order:\n            if node.left is not None:\n                order.append(node.left)\n            if node.right is not None:\n                order.append(node.right)\n        ids={}\n        types={}\n        counts={}\n        result=0\n        for node in reversed(order):\n            a=0 if node.left is None else ids[node.left]\n            b=0 if node.right is None else ids[node.right]\n            key=(node.val,a,b)\n            if key not in types:\n                types[key]=len(types)+1\n            ident=types[key]\n            ids[node]=ident\n            counts[ident]=counts.get(ident,0)+1\n            if counts[ident]==2:\n                result+=1\n        return result\n",
    ),
  },
  {
    ...common,
    id: "trees-16",
    slug: "count-nodes-meeting-every-ancestor-maximum",
    title: "Count nodes that meet their ancestor maximum",
    step: 3,
    skillIds: [
      "trees.child-links",
      "trees.branch-local-maximum",
      "trees.ancestor-value-predicate",
    ],
    prerequisites: ["trees.child-links"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-05", "trees-06", "trees-11", "trees-13"],
    nextIds: ["trees-14", "trees-15"],
    objective:
      "Count nodes whose values are at least every value on their own root-to-parent route.",
    rationale:
      "Each branch carries its own ancestor maximum; comparing only with the immediate parent or rejecting ties is incorrect.",
    statement:
      "## Compare against all ancestors\n\nCount nodes whose values are greater than or equal to every ancestor value on their own route from the root. The root always counts because it has no ancestor. Equality is allowed. A node that beats its immediate parent but remains below an earlier ancestor does not count. Values may be negative; do not initialize an ancestor maximum to zero. An empty tree returns zero.\n\n" +
      native,
    interface: "Solution.solve(root) returns int.",
    visible: [
      {
        input: { root: [5, 2, 6, 4] },
        expected: 2,
        explanation:
          "The root 5 and its right child 6 qualify. Node 4 beats its parent 2 but remains below ancestor 5.",
      },
      {
        input: { root: [-2, -2, -3] },
        expected: 2,
        explanation:
          "The root and equal-valued left child count; the lower-valued right child does not.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "There is no node to count.",
      },
    ],
    oracle: ancestorMaximum,
    independent: ancestorIndependent,
    mutations: {
      "reject-equal-ancestor-values": (input) => ancestorMaximum(input, true),
      "compare-only-immediate-parent": (input) =>
        ancestorMaximum(input, false, true),
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode node;long max;Frame(TreeNode n,long m){node=n;max=m;}}public int solve(TreeNode root){if(root==null)return 0;ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,Long.MIN_VALUE));int count=0;while(!stack.isEmpty()){Frame f=stack.pop();TreeNode n=f.node;if(n.val>=f.max)count++;long next=Math.max(f.max,n.val);if(n.left!=null)stack.push(new Frame(n.left,next));if(n.right!=null)stack.push(new Frame(n.right,next));}return count;}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;vector<pair<TreeNode*,long long>> stack{{root,LLONG_MIN}};int count=0;while(!stack.empty()){auto item=stack.back();stack.pop_back();auto n=item.first;auto prior=item.second;if(n->val>=prior)count++;long long next=max(prior,(long long)n->val);if(n->left)stack.push_back({n->left,next});if(n->right)stack.push_back({n->right,next});}return count;}};",
      'class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [(root,float("-inf"))]\n        count=0\n        while stack:\n            node,prior=stack.pop()\n            if node.val>=prior:\n                count+=1\n            next_max=max(prior,node.val)\n            if node.left is not None:\n                stack.append((node.left,next_max))\n            if node.right is not None:\n                stack.append((node.right,next_max))\n        return count\n',
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
      "Trees13–16 source-only author audit; independent models and canonical candidate checks, no language reference execution",
    prepared: [],
    failures: [],
  };
  report.emptyEncodingRegression = definitions.map((d) => {
    const baseline = d.oracle({ root: [] });
    const results = [[], [null], [null, null]].map((root) => ({
      encoding: root,
      expected: baseline,
      oracle: d.oracle({ root }),
      independent: d.independent({ root }),
    }));
    if (
      results.some((r) => r.oracle !== baseline || r.independent !== baseline)
    )
      report.failures.push(d.id + ": equivalent empty encodings disagree");
    return { id: d.id, results, countedAsHidden: false };
  });
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden]) {
      const expected = d.oracle(c.input);
      if (JSON.stringify(expected) !== JSON.stringify(d.independent(c.input)))
        report.failures.push(d.id + ": independent mismatch");
      if (
        c.expected !== undefined &&
        JSON.stringify(expected) !== JSON.stringify(c.expected)
      )
        report.failures.push(d.id + ": declared expected mismatch");
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
    "docs/release-evidence/content-trees-subtree-summary-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-subtree-summary-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-subtree-summary.mjs")) audit();
