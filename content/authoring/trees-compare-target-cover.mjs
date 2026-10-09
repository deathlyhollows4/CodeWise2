import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
const rootSchema = foundation[0].inputSchema.properties.root;
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    queue = [root];
  let at = 1;
  for (const n of queue)
    for (const side of ["left", "right"]) {
      if (at >= values.length) break;
      const value = values[at++];
      if (value !== null) {
        n[side] = { val: value, left: null, right: null };
        queue.push(n[side]);
      }
    }
  return root;
}
const normalized = (values) => {
  const out = [...values];
  while (out.at(-1) === null) out.pop();
  return out;
};
function sameTree({ a, b }) {
  const stack = [[decode(a), decode(b)]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (!x || !y) {
      if (x !== y) return false;
      continue;
    }
    if (x.val !== y.val) return false;
    stack.push([x.left, y.left], [x.right, y.right]);
  }
  return true;
}
const sameEncoding = ({ a, b }) =>
  JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));
function pairs() {
  const base = foundation[0].generate(),
    out = [];
  for (let i = 0; i < base.length; i++) {
    const a = [...base[i].input.root];
    let b;
    if (i % 3 === 0) b = [...a];
    else if (i % 3 === 1) b = [...base[(i + 17) % base.length].input.root];
    else {
      b = [...a];
      const at = b.findIndex((v) => v !== null);
      if (at >= 0) b[at] += b[at] === 1000000000 ? -1 : 1;
    }
    out.push({
      input: { a, b },
      category: i % 3 ? "shape-or-value-difference" : "identical-sparse-copies",
    });
  }
  for (let n = 2; n <= 160; n++) {
    const values = Array.from({ length: n }, (_, i) => (i % 5) - 2);
    let left = null,
      right = null;
    for (let i = n - 1; i >= 0; i--) {
      left = { val: values[i], left, right: null };
      right = { val: values[i], left: null, right };
    }
    const encode = (node) => {
      const q = [node],
        out = [];
      for (const item of q) {
        if (item) {
          out.push(item.val);
          q.push(item.left, item.right);
        } else out.push(null);
      }
      while (out.at(-1) === null) out.pop();
      return out;
    };
    out.push({
      input: { a: encode(left), b: encode(right) },
      category: "same-nonnull-sequence-opposite-child-shapes",
    });
  }
  return out;
}
function complete({ root }) {
  const tree = decode(root);
  if (!tree) return true;
  const queue = [tree];
  let missing = false;
  for (const node of queue) {
    if (node === null) {
      missing = true;
      continue;
    }
    if (missing) return false;
    queue.push(node.left, node.right);
  }
  return true;
}
const completeEncoding = ({ root }) =>
  normalized(root).every((value) => value !== null);
function leafTarget({ root, target }) {
  const tree = decode(root),
    stack = tree ? [[tree, 0]] : [];
  while (stack.length) {
    const [node, prior] = stack.pop(),
      sum = prior + node.val;
    if (!node.left && !node.right && sum === target) return true;
    if (node.left) stack.push([node.left, sum]);
    if (node.right) stack.push([node.right, sum]);
  }
  return false;
}
function targetByParents({ root, target }) {
  if (!root.length || root[0] === null) return false;
  const map = new Map([[0, { parent: null, left: null, right: null }]]),
    queue = [0];
  let cursor = 1;
  for (const id of queue)
    for (const side of ["left", "right"]) {
      if (cursor >= root.length) break;
      const child = cursor++;
      if (root[child] !== null) {
        map.get(id)[side] = child;
        map.set(child, { parent: id, left: null, right: null });
        queue.push(child);
      }
    }
  for (const [id, n] of map)
    if (n.left === null && n.right === null) {
      let sum = 0,
        at = id;
      while (at !== null) {
        sum += root[at];
        at = map.get(at).parent;
      }
      if (sum === target) return true;
    }
  return false;
}
function targets() {
  const out = [];
  for (const [index, c] of foundation[0].generate().entries()) {
    const root = [...c.input.root],
      tree = decode(root);
    let target =
      index % 4 === 3
        ? 1000000000000
        : index % 4 === 2
          ? (index % 41) - 20
          : (tree?.val ?? 0);
    if (index % 4 === 0 && tree) {
      target = 0;
      let node = tree;
      while (node) {
        target += node.val;
        node = node.left ?? node.right;
      }
    }
    out.push({
      input: { root, target },
      category:
        index % 4
          ? "negative-and-internal-match-counterexamples"
          : "existing-complete-leaf-route",
    });
  }
  out.push({
    input: {
      root: Array.from({ length: 3999 }, (_, i) =>
        i % 2 === 1 ? 1000000000 : i === 0 ? 1000000000 : null,
      ),
      target: 2000000000000,
    },
    category: "deep-wide-sum-2000-node-route",
  });
  return out;
}
function cameraGreedy({ root }, forgetRoot = false) {
  const tree = decode(root),
    stack = tree ? [[tree, false]] : [],
    state = new Map();
  let cameras = 0;
  while (stack.length) {
    const [node, done] = stack.pop();
    if (!done) {
      stack.push([node, true]);
      if (node.right) stack.push([node.right, false]);
      if (node.left) stack.push([node.left, false]);
      continue;
    }
    const a = node.left ? state.get(node.left) : 2,
      b = node.right ? state.get(node.right) : 2;
    if (a === 0 || b === 0) {
      state.set(node, 1);
      cameras++;
    } else state.set(node, a === 1 || b === 1 ? 2 : 0);
  }
  return cameras + (!forgetRoot && tree && state.get(tree) === 0 ? 1 : 0);
}
function cameraDP({ root }) {
  const tree = decode(root);
  if (!tree) return 0;
  const stack = [[tree, false]],
    cost = new Map(),
    inf = 2001,
    empty = [inf, 0, 0];
  while (stack.length) {
    const [node, done] = stack.pop();
    if (!done) {
      stack.push([node, true]);
      if (node.right) stack.push([node.right, false]);
      if (node.left) stack.push([node.left, false]);
      continue;
    }
    const a = node.left ? cost.get(node.left) : empty,
      b = node.right ? cost.get(node.right) : empty;
    const withCamera = 1 + Math.min(...a) + Math.min(...b),
      coveredByChild = Math.min(
        a[0] + Math.min(b[0], b[1]),
        b[0] + Math.min(a[0], a[1]),
      ),
      needsParent = a[1] + b[1];
    cost.set(node, [withCamera, coveredByChild, needsParent]);
  }
  const result = cost.get(tree);
  return Math.min(result[0], result[1]);
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-compare-target-cover.mjs",
  inputSchema: { kind: "object", properties: { root: rootSchema } },
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  constraints: foundation[0].constraints,
  outputSchema: { kind: "boolean" },
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "boolean",
    readOnlyNodes: true,
  },
  generate: () => foundation[0].generate(),
};
const native =
  "## Native arguments\n\nNodes are genuine TreeNode objects with val, left, and right. Missing children are null. The runner supplies the class and constructs links; do not redeclare it or write a parser. Do not change original values/links or delete input nodes.\n\n### Representation note\n\nExamples use compact breadth-first value arrays with null child slots and no trailing nulls. Children are read for existing parents in queue order. Your function receives native roots, not those arrays.";
export const definitions = [
  {
    ...common,
    id: "trees-09",
    slug: "two-native-tree-value-shape-equality",
    title: "Compare two arbitrary trees",
    step: 2,
    skillIds: [
      "trees.paired-structure-comparison",
      "trees.value-and-null-equality",
    ],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-04", "trees-07", "trees-08", "trees-10"],
    remedialIds: ["trees-01"],
    nextIds: ["trees-05", "trees-06", "trees-11"],
    objective:
      "Compare both node values and corresponding child structure of two independently supplied trees.",
    rationale:
      "Equal visit sequences or equal node multisets do not establish corresponding left/right structure.",
    statement:
      "## Compare values and structure\n\nReturn true exactly when a and b have the same shape and equal values at every corresponding node. Compare left with left and right with right. These are two arbitrary input trees, not a request to mirror either one. Two empty roots are equal; one empty and one nonempty root are not. Duplicate values do not hide a structural difference.\n\n" +
      native,
    interface:
      "Solution.solve(a,b) receives two TreeNode roots and returns boolean.",
    constraints: [
      "Each input tree independently has at most 2,000 native nodes.",
      "Node values lie in [-1,000,000,000,1,000,000,000].",
      "Both trees are finite; original values and links remain unchanged.",
    ],
    inputSchema: {
      kind: "object",
      properties: { a: rootSchema, b: rootSchema },
    },
    semanticConstraints: [
      { kind: "tree-level", field: "a", maxNodes: 2000 },
      { kind: "tree-level", field: "b", maxNodes: 2000 },
    ],
    function: {
      arguments: [
        { name: "a", type: "TreeNode" },
        { name: "b", type: "TreeNode" },
      ],
      returnType: "boolean",
      readOnlyNodes: true,
    },
    visible: [
      {
        input: { a: [1, 2, 3], b: [1, 2, 3] },
        expected: true,
        explanation: "All corresponding values and both child positions agree.",
      },
      {
        input: { a: [1, 7], b: [1, null, 7] },
        expected: false,
        explanation: "The equal-valued child occupies different sides.",
      },
      {
        input: { a: [], b: [] },
        expected: true,
        explanation: "Two null roots describe the same empty tree.",
      },
    ],
    generate: pairs,
    oracle: sameTree,
    independent: sameEncoding,
    mutations: {
      "compare-nonnull-value-sequence-only": ({ a, b }) =>
        JSON.stringify(a.filter((v) => v !== null)) ===
        JSON.stringify(b.filter((v) => v !== null)),
      "ignore-all-node-values": ({ a, b }) =>
        JSON.stringify(normalized(a).map((v) => v !== null)) ===
        JSON.stringify(normalized(b).map((v) => v !== null)),
    },
    languages: refs(
      "class Solution {public boolean solve(TreeNode a,TreeNode b){ArrayDeque<TreeNode[]> stack=new ArrayDeque<>();stack.push(new TreeNode[]{a,b});while(!stack.isEmpty()){TreeNode[] pair=stack.pop();TreeNode x=pair[0],y=pair[1];if(x==null||y==null){if(x!=y)return false;continue;}if(x.val!=y.val)return false;stack.push(new TreeNode[]{x.left,y.left});stack.push(new TreeNode[]{x.right,y.right});}return true;}}",
      "class Solution {public:bool solve(TreeNode* a,TreeNode* b){vector<pair<TreeNode*,TreeNode*>> stack{{a,b}};while(!stack.empty()){auto item=stack.back();stack.pop_back();auto x=item.first;auto y=item.second;if(!x||!y){if(x!=y)return false;continue;}if(x->val!=y->val)return false;stack.push_back({x->left,y->left});stack.push_back({x->right,y->right});}return true;}};",
      "class Solution:\n    def solve(self, a, b):\n        stack=[(a,b)]\n        while stack:\n            x,y=stack.pop()\n            if x is None or y is None:\n                if x is not y:\n                    return False\n                continue\n            if x.val!=y.val:\n                return False\n            stack.append((x.left,y.left))\n            stack.append((x.right,y.right))\n        return True\n",
    ),
  },
  {
    ...common,
    id: "trees-10",
    slug: "native-binary-tree-completeness",
    title: "Check whether the tree fills every earlier position",
    step: 2,
    skillIds: ["trees.breadth-first-gap-invariant", "trees.complete-shape"],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-07", "trees-08", "trees-09"],
    remedialIds: ["trees-01"],
    nextIds: ["trees-05", "trees-06", "trees-11"],
    objective:
      "Check the complete-tree shape rule: full earlier levels and a left-filled final level.",
    rationale:
      "After the first missing breadth-first child position, any later existing node proves an incomplete shape.",
    statement:
      "## Check completeness\n\nA complete binary tree has every level full except possibly its last level, whose nodes occupy the leftmost positions without gaps. Return whether the input has this shape. Values do not affect completeness. An empty tree and a singleton are complete. A node with a right child but no left child is incomplete.\n\n" +
      native,
    interface: "Solution.solve(root) receives TreeNode and returns boolean.",
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5, 6] },
        expected: true,
        explanation: "The final level fills its positions from the left.",
      },
      {
        input: { root: [1, 2, 3, null, 4] },
        expected: false,
        explanation: "A missing position appears before a later existing node.",
      },
      {
        input: { root: [] },
        expected: true,
        explanation: "No node violates completeness in an empty tree.",
      },
    ],
    oracle: complete,
    independent: completeEncoding,
    mutations: {
      "only-check-local-right-without-left": ({ root }) => {
        const tree = decode(root),
          stack = tree ? [tree] : [];
        while (stack.length) {
          const n = stack.pop();
          if (!n.left && n.right) return false;
          if (n.left) stack.push(n.left);
          if (n.right) stack.push(n.right);
        }
        return true;
      },
      "all-nonempty-trees-complete": () => true,
    },
    languages: refs(
      "class Solution {public boolean solve(TreeNode root){if(root==null)return true;ArrayList<TreeNode> queue=new ArrayList<>();queue.add(root);boolean missing=false;for(int i=0;i<queue.size();i++){TreeNode n=queue.get(i);if(n==null){missing=true;continue;}if(missing)return false;queue.add(n.left);queue.add(n.right);}return true;}}",
      "class Solution {public:bool solve(TreeNode* root){if(!root)return true;vector<TreeNode*> queue{root};bool missing=false;for(size_t i=0;i<queue.size();i++){auto n=queue[i];if(!n){missing=true;continue;}if(missing)return false;queue.push_back(n->left);queue.push_back(n->right);}return true;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return True\n        queue=[root]\n        missing=False\n        for node in queue:\n            if node is None:\n                missing=True\n                continue\n            if missing:\n                return False\n            queue.append(node.left)\n            queue.append(node.right)\n        return True\n",
    ),
  },
  {
    ...common,
    id: "trees-11",
    slug: "signed-root-to-leaf-target-total",
    title: "Find a complete root-to-leaf target total",
    step: 3,
    skillIds: ["trees.branch-local-sum", "trees.leaf-only-target"],
    prerequisites: [
      "trees.child-links",
      "trees.leaf-predicate",
      "numbers.signed-accumulation",
    ],
    checkpointIds: ["trees-05", "trees-06"],
    remedialIds: ["trees-01", "trees-02", "arrays-hashing-01"],
    nextIds: ["trees-26"],
    objective:
      "Test whether one complete root-to-leaf route has the supplied signed total, without accepting internal prefixes or pruning negative values incorrectly.",
    rationale:
      "Each branch needs its own accumulated sum, and a matching internal node is not a completed route.",
    statement:
      "## Reach the target at a leaf\n\nReturn true if at least one complete route from the root to a leaf has values summing to target. Include every node on that route. A matching internal prefix does not count. Values may be negative, so a sum above target is not a reason to discard that branch. An empty tree has no route, even when target is zero.\n\n`solve(root,target)` receives the native root and a signed wide integer. Accumulate with a wide integer type.\n\n" +
      native,
    interface:
      "Solution.solve(root,target) receives TreeNode and long / long long and returns boolean.",
    constraints: [
      ...common.constraints,
      "-2,000,000,000,000 ≤ target ≤ 2,000,000,000,000.",
    ],
    inputSchema: {
      kind: "object",
      properties: {
        root: rootSchema,
        target: {
          kind: "integer",
          minimum: -2000000000000,
          maximum: 2000000000000,
        },
      },
    },
    visible: [
      {
        input: { root: [1, -2, 3, 4, null, -5, 6], target: 3 },
        expected: true,
        explanation: "The complete route 1 → -2 → 4 totals 3.",
      },
      {
        input: { root: [5, 1, 2], target: 5 },
        expected: false,
        explanation:
          "The root matches, but both complete routes continue to totals 6 and 7.",
      },
      {
        input: { root: [], target: 0 },
        expected: false,
        explanation: "A null root is not a complete route.",
      },
    ],
    generate: targets,
    oracle: leafTarget,
    independent: targetByParents,
    mutations: {
      "accept-internal-prefix": ({ root, target }) => {
        const tree = decode(root),
          stack = tree ? [[tree, 0]] : [];
        while (stack.length) {
          const [n, p] = stack.pop(),
            sum = p + n.val;
          if (sum === target) return true;
          if (n.left) stack.push([n.left, sum]);
          if (n.right) stack.push([n.right, sum]);
        }
        return false;
      },
      "discard-sum-above-target": ({ root, target }) => {
        const tree = decode(root),
          stack = tree ? [[tree, 0]] : [];
        while (stack.length) {
          const [n, p] = stack.pop(),
            sum = p + n.val;
          if (sum > target) continue;
          if (!n.left && !n.right && sum === target) return true;
          if (n.left) stack.push([n.left, sum]);
          if (n.right) stack.push([n.right, sum]);
        }
        return false;
      },
    },
    function: {
      arguments: [
        { name: "root", type: "TreeNode" },
        { name: "target", type: "long" },
      ],
      returnType: "boolean",
      readOnlyNodes: true,
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode node;long prior;Frame(TreeNode n,long p){node=n;prior=p;}}public boolean solve(TreeNode root,long target){ArrayDeque<Frame> stack=new ArrayDeque<>();if(root!=null)stack.push(new Frame(root,0));while(!stack.isEmpty()){Frame f=stack.pop();TreeNode n=f.node;long sum=f.prior+n.val;if(n.left==null&&n.right==null&&sum==target)return true;if(n.left!=null)stack.push(new Frame(n.left,sum));if(n.right!=null)stack.push(new Frame(n.right,sum));}return false;}}",
      "class Solution {public:bool solve(TreeNode* root,long long target){vector<pair<TreeNode*,long long>> stack;if(root)stack.push_back({root,0});while(!stack.empty()){auto item=stack.back();stack.pop_back();auto n=item.first;long long sum=item.second+n->val;if(!n->left&&!n->right&&sum==target)return true;if(n->left)stack.push_back({n->left,sum});if(n->right)stack.push_back({n->right,sum});}return false;}};",
      "class Solution:\n    def solve(self, root, target):\n        stack=[] if root is None else [(root,0)]\n        while stack:\n            node,prior=stack.pop()\n            total=prior+node.val\n            if node.left is None and node.right is None and total==target:\n                return True\n            if node.left is not None:\n                stack.append((node.left,total))\n            if node.right is not None:\n                stack.append((node.right,total))\n        return False\n",
    ),
  },
  {
    ...common,
    id: "trees-12",
    slug: "minimum-parent-self-child-camera-cover",
    title: "Cover the tree with as few cameras as possible",
    step: 5,
    skillIds: [
      "trees.coverage-state-combination",
      "trees.parent-placement-choice",
    ],
    prerequisites: ["trees.child-links", "trees.subtree-round-dependencies"],
    checkpointIds: ["trees-28", "trees-29", "trees-30"],
    remedialIds: ["trees-01", "trees-05"],
    nextIds: [],
    objective:
      "Minimize cameras placed on original tree nodes when each camera covers its parent, itself, and immediate children.",
    rationale:
      "A child needing coverage forces a placement decision at its parent; the root must be checked separately because it has no parent.",
    statement:
      "## Cover every node\n\nChoose nodes at which to place cameras. Each camera covers its own node, its parent if one exists, and its immediate left/right children. Return the minimum number of cameras needed to cover every node. Values do not affect coverage, and a camera does not cover a grandchild directly. An empty tree needs zero cameras.\n\nYou report the minimum count rather than changing the tree or annotating chosen nodes. Different placements can attain the same minimum.\n\n" +
      native,
    interface: "Solution.solve(root) receives TreeNode and returns int.",
    outputSchema: { kind: "integer", minimum: 0, maximum: 2000 },
    function: {
      arguments: [{ name: "root", type: "TreeNode" }],
      returnType: "int",
      readOnlyNodes: true,
    },
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5, 6, 7] },
        expected: 2,
        explanation:
          "Cameras at nodes 2 and 3 cover the root, both internal nodes, and all four leaves.",
      },
      {
        input: { root: [7] },
        expected: 1,
        explanation: "A singleton must cover itself.",
      },
      {
        input: { root: [] },
        expected: 0,
        explanation: "There is no node requiring coverage.",
      },
    ],
    oracle: cameraGreedy,
    independent: cameraDP,
    mutations: {
      "forget-uncovered-root": (input) => cameraGreedy(input, true),
      "place-camera-at-every-leaf": ({ root }) => {
        const tree = decode(root),
          stack = tree ? [tree] : [];
        let n = 0;
        while (stack.length) {
          const node = stack.pop();
          if (!node.left && !node.right) n++;
          if (node.left) stack.push(node.left);
          if (node.right) stack.push(node.right);
        }
        return n;
      },
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode node;boolean done;Frame(TreeNode n,boolean d){node=n;done=d;}}public int solve(TreeNode root){if(root==null)return 0;IdentityHashMap<TreeNode,Integer> state=new IdentityHashMap<>();ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,false));int cameras=0;while(!stack.isEmpty()){Frame f=stack.pop();TreeNode n=f.node;if(!f.done){stack.push(new Frame(n,true));if(n.right!=null)stack.push(new Frame(n.right,false));if(n.left!=null)stack.push(new Frame(n.left,false));continue;}int a=n.left==null?2:state.get(n.left),b=n.right==null?2:state.get(n.right);if(a==0||b==0){state.put(n,1);cameras++;}else state.put(n,a==1||b==1?2:0);}return cameras+(state.get(root)==0?1:0);}}",
      "class Solution {public:int solve(TreeNode* root){if(!root)return 0;unordered_map<TreeNode*,int> state;vector<pair<TreeNode*,bool>> stack{{root,false}};int cameras=0;while(!stack.empty()){auto item=stack.back();stack.pop_back();auto n=item.first;if(!item.second){stack.push_back({n,true});if(n->right)stack.push_back({n->right,false});if(n->left)stack.push_back({n->left,false});continue;}int a=n->left?state.at(n->left):2,b=n->right?state.at(n->right):2;if(a==0||b==0){state[n]=1;cameras++;}else state[n]=a==1||b==1?2:0;}return cameras+(state.at(root)==0?1:0);}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return 0\n        state={}\n        stack=[(root,False)]\n        cameras=0\n        while stack:\n            node,done=stack.pop()\n            if not done:\n                stack.append((node,True))\n                if node.right is not None:\n                    stack.append((node.right,False))\n                if node.left is not None:\n                    stack.append((node.left,False))\n                continue\n            a=2 if node.left is None else state[node.left]\n            b=2 if node.right is None else state[node.right]\n            if a==0 or b==0:\n                state[node]=1\n                cameras+=1\n            else:\n                state[node]=2 if a==1 or b==1 else 0\n        return cameras+(1 if state[root]==0 else 0)\n",
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
      "Trees09–12 author-only canonical candidates; independent iterative DP/structural/path models, no language reference execution",
    prepared: [],
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
      if (!m.detected) report.failures.push(d.id + ": mutation " + m.name);
    report.prepared.push({
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-trees-compare-target-cover-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-compare-target-cover-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-compare-target-cover.mjs")) audit();
