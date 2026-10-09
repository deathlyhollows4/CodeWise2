import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000000, maximum: 1000000000 };
const matrix = {
  kind: "array",
  maxLength: 2000,
  items: { kind: "array", maxLength: 2000, items: integer },
};
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    queue = [root];
  let i = 1;
  for (const node of queue)
    for (const side of ["left", "right"]) {
      if (i >= values.length) break;
      const value = values[i++];
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
function indexed(values) {
  const map = new Map();
  if (!values.length || values[0] === null) return map;
  map.set(0, { left: null, right: null, parent: null });
  const queue = [0];
  let i = 1;
  for (const id of queue)
    for (const side of ["left", "right"]) {
      if (i >= values.length) break;
      const child = i++;
      if (values[child] !== null) {
        map.get(id)[side] = child;
        map.set(child, { left: null, right: null, parent: id });
        queue.push(child);
      }
    }
  return map;
}
function leavesByDepth({ root }) {
  const tree = decode(root),
    stack = tree ? [[tree, 0]] : [],
    out = [];
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (!node.left && !node.right) {
      while (out.length <= depth) out.push([]);
      out[depth].push(node.val);
    }
    if (node.right) stack.push([node.right, depth + 1]);
    if (node.left) stack.push([node.left, depth + 1]);
  }
  return out;
}
function leavesByParents({ root }) {
  const map = indexed(root),
    out = [];
  for (const [id, node] of map)
    if (node.left === null && node.right === null) {
      let depth = 0,
        parent = node.parent;
      while (parent !== null) {
        depth++;
        parent = map.get(parent).parent;
      }
      while (out.length <= depth) out.push([]);
      out[depth].push(root[id]);
    }
  return out;
}
function pruningRounds({ root }) {
  const map = indexed(root),
    remaining = new Set(map.keys()),
    order = [],
    stack = map.size ? [0] : [];
  while (stack.length) {
    const id = stack.pop();
    order.push(id);
    const node = map.get(id);
    if (node.right !== null) stack.push(node.right);
    if (node.left !== null) stack.push(node.left);
  }
  const rounds = [];
  while (remaining.size) {
    const current = order.filter(
      (id) =>
        remaining.has(id) &&
        ["left", "right"].every(
          (side) =>
            map.get(id)[side] === null || !remaining.has(map.get(id)[side]),
        ),
    );
    rounds.push(current.map((id) => root[id]));
    for (const id of current) remaining.delete(id);
  }
  return rounds;
}
function subtreeHeightRounds({ root }) {
  const tree = decode(root),
    stack = tree ? [[tree, false]] : [],
    heights = new Map(),
    rows = [];
  while (stack.length) {
    const [node, done] = stack.pop();
    if (!done) {
      stack.push([node, true]);
      if (node.right) stack.push([node.right, false]);
      if (node.left) stack.push([node.left, false]);
      continue;
    }
    const height =
      1 +
      Math.max(
        node.left ? heights.get(node.left) : -1,
        node.right ? heights.get(node.right) : -1,
      );
    heights.set(node, height);
    while (rows.length <= height) rows.push([]);
    rows[height].push(node.val);
  }
  return rows;
}
const leaf = (node) => !node.left && !node.right;
function boundary({ root }) {
  const tree = decode(root);
  if (!tree) return [];
  if (leaf(tree)) return [tree.val];
  const out = [tree.val];
  let node = tree.left;
  while (node) {
    if (!leaf(node)) out.push(node.val);
    node = node.left ?? node.right;
  }
  const stack = [tree];
  while (stack.length) {
    node = stack.pop();
    if (leaf(node)) out.push(node.val);
    else {
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
  }
  const right = [];
  node = tree.right;
  while (node) {
    if (!leaf(node)) right.push(node.val);
    node = node.right ?? node.left;
  }
  return out.concat(right.reverse());
}
function boundaryByEndpoints({ root }) {
  const map = indexed(root);
  if (!map.size) return [];
  const isLeaf = (id) =>
    map.get(id).left === null && map.get(id).right === null;
  if (isLeaf(0)) return [root[0]];
  function firstLeaf(start, rightFirst) {
    if (start === null) return null;
    const stack = [start];
    while (stack.length) {
      const id = stack.pop();
      if (isLeaf(id)) return id;
      const node = map.get(id),
        sides = rightFirst ? ["left", "right"] : ["right", "left"];
      for (const side of sides) if (node[side] !== null) stack.push(node[side]);
    }
    return null;
  }
  const leftLeaf = firstLeaf(map.get(0).left, false),
    rightLeaf = firstLeaf(map.get(0).right, true);
  function ancestors(leaf) {
    const out = [];
    let id = leaf === null ? null : map.get(leaf).parent;
    while (id !== null && id !== 0) {
      out.push(id);
      id = map.get(id).parent;
    }
    return out;
  }
  const leaves = [],
    stack = [0];
  while (stack.length) {
    const id = stack.pop(),
      node = map.get(id);
    if (isLeaf(id)) leaves.push(id);
    else {
      if (node.right !== null) stack.push(node.right);
      if (node.left !== null) stack.push(node.left);
    }
  }
  return [
    0,
    ...ancestors(leftLeaf).reverse(),
    ...leaves,
    ...ancestors(rightLeaf),
  ].map((id) => root[id]);
}
function levels({ root }) {
  let nodes = decode(root);
  let level = nodes ? [nodes] : [],
    out = [];
  while (level.length) {
    out.push(level.map((node) => node.val));
    const next = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return out;
}
function levelsByParents({ root }) {
  const map = indexed(root),
    out = [];
  for (const [id, node] of map) {
    let depth = 0,
      parent = node.parent;
    while (parent !== null) {
      depth++;
      parent = map.get(parent).parent;
    }
    while (out.length <= depth) out.push([]);
    out[depth].push(root[id]);
  }
  return out;
}
function mirror({ root }) {
  const tree = decode(root),
    stack = tree ? [tree] : [];
  while (stack.length) {
    const node = stack.pop();
    [node.left, node.right] = [node.right, node.left];
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }
  return encode(tree);
}
function mirrorIndexed({ root }) {
  const map = indexed(root);
  if (!map.size) return [];
  const queue = [0],
    out = [];
  for (const id of queue) {
    if (id === null) {
      out.push(null);
      continue;
    }
    out.push(root[id]);
    queue.push(map.get(id).right, map.get(id).left);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
const common = {
  primaryTopic: "trees",
  generatorModule: "content/authoring/trees-next.mjs",
  inputSchema: foundation[0].inputSchema,
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  constraints: foundation[0].constraints,
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "int[][]",
    readOnlyNodes: true,
  },
  generate: () => foundation[0].generate(),
};
const note =
  "## Native function\n\nYou receive a TreeNode root or null. Nodes expose val, left, and right. The runner supplies the class and native links; do not redeclare it or parse JSON. Do not delete input nodes.\n\n### Representation note\n\nExamples show compact breadth-first values with null child slots and no trailing nulls. Children are read for existing parents in queue order, rather than using heap indexes. Your function receives actual linked nodes.";
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
export const definitions = [
  {
    ...common,
    id: "trees-05",
    slug: "simultaneous-leaf-removal-rounds",
    title: "Peel away all current leaves each round",
    step: 3,
    skillIds: [
      "trees.subtree-round-dependencies",
      "trees.simultaneous-peeling",
    ],
    prerequisites: [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.preorder-order",
    ],
    checkpointIds: ["trees-06"],
    remedialIds: ["trees-01", "trees-02", "trees-04"],
    nextIds: ["trees-14", "trees-15"],
    objective:
      "Group every original value by the round in which its node becomes a leaf after simultaneous previous removals.",
    rationale:
      "A node becomes removable only after both child subtrees are gone; original root depth does not determine its removal round.",
    statement:
      "## Peel the tree in rounds\n\nIn round 0, collect every current leaf and remove all of them simultaneously. In each following round, collect and remove all nodes that have now become leaves. Continue until the tree is empty. Return the collected values as one row per round, preserving repeated values from distinct nodes.\n\nWithin each round, list the original nodes from left to right in the original tree. Nodes in one round are never ancestors of each other; the first left/right choice after their common ancestor defines this order. A newly exposed parent waits until the next round, rather than joining the round that removed its children.\n\nThese removals are conceptual: leave the original node values and links unchanged. An empty tree returns no rows, and a singleton appears in round 0. Every original node contributes exactly once.\n\n" +
      note,
    interface:
      "Solution.solve(root) returns int[][] / vector<vector<int>> / Python list[list[int]].",
    outputSchema: matrix,
    visible: [
      {
        input: { root: [1, 2, 3, null, 4] },
        expected: [[4, 3], [2], [1]],
        explanation:
          "Leaves 4 and 3 disappear together despite different root depths; node 2 waits for the next round, then root 1 follows.",
      },
      {
        input: { root: [-7] },
        expected: [[-7]],
        explanation: "The only node is already a leaf in round 0.",
      },
      {
        input: { root: [] },
        expected: [],
        explanation: "There is no removal round for a null root.",
      },
    ],
    oracle: pruningRounds,
    independent: subtreeHeightRounds,
    mutations: {
      "only-original-leaves-by-depth": leavesByDepth,
      "remove-new-parents-in-same-round": (input) => {
        const rounds = pruningRounds(input);
        return rounds.length ? [rounds.flat()] : [];
      },
    },
    languages: refs(
      "class Solution {static class Frame{TreeNode node;boolean done;Frame(TreeNode n,boolean d){node=n;done=d;}}public int[][] solve(TreeNode root){ArrayList<ArrayList<Integer>> rows=new ArrayList<>();IdentityHashMap<TreeNode,Integer> height=new IdentityHashMap<>();ArrayDeque<Frame> stack=new ArrayDeque<>();if(root!=null)stack.push(new Frame(root,false));while(!stack.isEmpty()){Frame f=stack.pop();TreeNode n=f.node;if(!f.done){stack.push(new Frame(n,true));if(n.right!=null)stack.push(new Frame(n.right,false));if(n.left!=null)stack.push(new Frame(n.left,false));continue;}int h=1+Math.max(n.left==null?-1:height.get(n.left),n.right==null?-1:height.get(n.right));height.put(n,h);while(rows.size()<=h)rows.add(new ArrayList<>());rows.get(h).add(n.val);}int[][] out=new int[rows.size()][];for(int i=0;i<out.length;i++)out[i]=rows.get(i).stream().mapToInt(Integer::intValue).toArray();return out;}}",
      "class Solution {public:vector<vector<int>> solve(TreeNode* root){vector<vector<int>> out;unordered_map<TreeNode*,int> height;vector<pair<TreeNode*,bool>> stack;if(root)stack.push_back({root,false});while(!stack.empty()){auto item=stack.back();stack.pop_back();auto n=item.first;if(!item.second){stack.push_back({n,true});if(n->right)stack.push_back({n->right,false});if(n->left)stack.push_back({n->left,false});continue;}int h=1+max(n->left?height.at(n->left):-1,n->right?height.at(n->right):-1);height[n]=h;if((int)out.size()<=h)out.resize(h+1);out[h].push_back(n->val);}return out;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [(root,False)]\n        height={}\n        rows=[]\n        while stack:\n            node,done=stack.pop()\n            if not done:\n                stack.append((node,True))\n                if node.right is not None:\n                    stack.append((node.right,False))\n                if node.left is not None:\n                    stack.append((node.left,False))\n                continue\n            h=1+max(height[node.left] if node.left is not None else -1,height[node.right] if node.right is not None else -1)\n            height[node]=h\n            while len(rows)<=h:\n                rows.append([])\n            rows[h].append(node.val)\n        return rows\n",
    ),
  },
  {
    ...common,
    id: "trees-06",
    slug: "anticlockwise-tree-boundary-values",
    title: "Trace the tree boundary without repeating leaves",
    step: 3,
    skillIds: ["trees.boundary-paths", "trees.nonduplicated-leaf-contour"],
    prerequisites: [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.preorder-order",
    ],
    checkpointIds: ["trees-05"],
    remedialIds: ["trees-01", "trees-02", "trees-04"],
    nextIds: ["trees-14", "trees-15"],
    objective:
      "Combine root, left boundary, ordered leaves, and reversed right boundary without repeating any node.",
    rationale:
      "Boundary paths exclude leaves because the leaf traversal already contributes them; one-child trees need explicit starting-side rules.",
    statement:
      "## Trace the boundary\n\nReturn the boundary values in this order: the root once, the non-leaf left boundary top down, every leaf left to right, then the non-leaf right boundary bottom up. A singleton returns its root value once; an empty tree returns an empty array.\n\nThe left boundary starts at root.left. At each node choose left if present, otherwise right, stopping at a leaf. If root.left is null, that boundary is empty. The right boundary starts at root.right, chooses right if present otherwise left, and is returned in reverse order without its leaf.\n\nDo not modify original values or links. Different nodes with equal values still contribute separate visits when they belong on the boundary.\n\n" +
      note,
    interface:
      "Solution.solve(root) returns int[] / vector<int> / Python list[int].",
    outputSchema: { kind: "array", maxLength: 2000, items: integer },
    function: { ...common.function, returnType: "int[]" },
    visible: [
      {
        input: { root: [1, 2, 3, 4, 5, 6, 7] },
        expected: [1, 2, 4, 5, 6, 7, 3],
        explanation:
          "Leaves containing 4, 5, 6 and 7 appear once between the left and right non-leaf boundaries.",
      },
      {
        input: { root: [1, null, 2, null, 3] },
        expected: [1, 3, 2],
        explanation:
          "There is no left boundary; append the leaf then the right boundary bottom up.",
      },
      {
        input: { root: [-7] },
        expected: [-7],
        explanation: "The root is also a leaf, so it appears only once.",
      },
    ],
    oracle: boundary,
    independent: boundaryByEndpoints,
    mutations: {
      "include-boundary-leaves-twice": ({ root }) => {
        const result = boundary({ root });
        const tree = decode(root);
        if (!tree || leaf(tree)) return result;
        let node = tree.left ?? tree.right;
        while (node && !leaf(node)) node = node.left ?? node.right;
        return node ? result.concat(node.val) : result;
      },
      "right-boundary-top-down": ({ root }) => {
        const tree = decode(root);
        if (!tree) return [];
        const values = [];
        let node = tree.right;
        while (node) {
          if (!leaf(node)) values.push(node.val);
          node = node.right ?? node.left;
        }
        const correct = boundary({ root });
        return values.length
          ? correct.slice(0, -values.length).concat(values)
          : correct;
      },
    },
    languages: refs(
      "class Solution {private boolean leaf(TreeNode n){return n.left==null&&n.right==null;}public int[] solve(TreeNode root){if(root==null)return new int[0];if(leaf(root))return new int[]{root.val};ArrayList<Integer> out=new ArrayList<>();out.add(root.val);TreeNode n=root.left;while(n!=null){if(!leaf(n))out.add(n.val);n=n.left!=null?n.left:n.right;}ArrayDeque<TreeNode> stack=new ArrayDeque<>();stack.push(root);while(!stack.isEmpty()){n=stack.pop();if(leaf(n))out.add(n.val);else{if(n.right!=null)stack.push(n.right);if(n.left!=null)stack.push(n.left);}}ArrayList<Integer> right=new ArrayList<>();n=root.right;while(n!=null){if(!leaf(n))right.add(n.val);n=n.right!=null?n.right:n.left;}for(int i=right.size()-1;i>=0;i--)out.add(right.get(i));return out.stream().mapToInt(Integer::intValue).toArray();}}",
      "class Solution {bool leaf(TreeNode* n){return !n->left&&!n->right;}public:vector<int> solve(TreeNode* root){if(!root)return {};if(leaf(root))return {root->val};vector<int> out{root->val};auto n=root->left;while(n){if(!leaf(n))out.push_back(n->val);n=n->left?n->left:n->right;}vector<TreeNode*> stack{root};while(!stack.empty()){n=stack.back();stack.pop_back();if(leaf(n))out.push_back(n->val);else{if(n->right)stack.push_back(n->right);if(n->left)stack.push_back(n->left);}}vector<int> right;n=root->right;while(n){if(!leaf(n))right.push_back(n->val);n=n->right?n->right:n->left;}out.insert(out.end(),right.rbegin(),right.rend());return out;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return []\n        def leaf(node):\n            return node.left is None and node.right is None\n        if leaf(root):\n            return [root.val]\n        out=[root.val]\n        node=root.left\n        while node is not None:\n            if not leaf(node):\n                out.append(node.val)\n            node=node.left if node.left is not None else node.right\n        stack=[root]\n        while stack:\n            node=stack.pop()\n            if leaf(node):\n                out.append(node.val)\n            else:\n                if node.right is not None:\n                    stack.append(node.right)\n                if node.left is not None:\n                    stack.append(node.left)\n        right=[]\n        node=root.right\n        while node is not None:\n            if not leaf(node):\n                right.append(node.val)\n            node=node.right if node.right is not None else node.left\n        return out+right[::-1]\n",
    ),
  },
  {
    ...common,
    id: "trees-07",
    slug: "native-breadth-first-level-values",
    title: "Keep each breadth-first level together",
    step: 2,
    skillIds: ["trees.level-grouping", "trees.level-boundary-capture"],
    prerequisites: ["trees.child-links", "trees.depth-tracking"],
    checkpointIds: ["trees-08"],
    remedialIds: ["trees-01", "trees-03"],
    nextIds: ["trees-05", "trees-06"],
    objective:
      "Return every node value grouped by depth, preserving left-to-right order and capturing each level before adding its children.",
    rationale:
      "A queue changes size while children are enqueued; capturing the current level size prevents mixing parent and child rows.",
    statement:
      "## Return the levels\n\nReturn one row for every depth, starting with the root at depth 0. Each row contains all node values at that depth in left-to-right order. Include internal nodes and leaves, keeping duplicate values as separate visits. An empty tree returns no rows; a singleton returns one row.\n\nDo not modify original values or links.\n\n" +
      note,
    interface:
      "Solution.solve(root) returns int[][] / vector<vector<int>> / Python list[list[int]].",
    outputSchema: matrix,
    visible: [
      {
        input: { root: [1, 2, 3, 4, null, null, 5] },
        expected: [[1], [2, 3], [4, 5]],
        explanation:
          "Capture each whole level before traversing the children enqueued for the next level.",
      },
      {
        input: { root: [7, 7, 7] },
        expected: [[7], [7, 7]],
        explanation:
          "Equal-valued nodes still occupy separate places in the level.",
      },
      {
        input: { root: [] },
        expected: [],
        explanation: "A null root has no level.",
      },
    ],
    oracle: levels,
    independent: levelsByParents,
    mutations: {
      "only-leaf-levels": leavesByDepth,
      "reverse-each-level": (input) =>
        levels(input).map((row) => row.reverse()),
    },
    languages: refs(
      "class Solution {public int[][] solve(TreeNode root){ArrayList<int[]> out=new ArrayList<>();ArrayDeque<TreeNode> queue=new ArrayDeque<>();if(root!=null)queue.add(root);while(!queue.isEmpty()){int size=queue.size();int[] row=new int[size];for(int i=0;i<size;i++){TreeNode n=queue.remove();row[i]=n.val;if(n.left!=null)queue.add(n.left);if(n.right!=null)queue.add(n.right);}out.add(row);}return out.toArray(new int[out.size()][]);}}",
      "class Solution {public:vector<vector<int>> solve(TreeNode* root){vector<vector<int>> out;queue<TreeNode*> nodes;if(root)nodes.push(root);while(!nodes.empty()){int size=nodes.size();vector<int> row;for(int i=0;i<size;i++){auto n=nodes.front();nodes.pop();row.push_back(n->val);if(n->left)nodes.push(n->left);if(n->right)nodes.push(n->right);}out.push_back(std::move(row));}return out;}};",
      "class Solution:\n    def solve(self, root):\n        level=[] if root is None else [root]\n        out=[]\n        while level:\n            out.append([node.val for node in level])\n            following=[]\n            for node in level:\n                if node.left is not None:\n                    following.append(node.left)\n                if node.right is not None:\n                    following.append(node.right)\n            level=following\n        return out\n",
    ),
  },
  {
    ...common,
    id: "trees-08",
    constraints: foundation[0].constraints.map(constraint =>
      constraint === "Do not modify original node values or links."
        ? "You may relink input child pointers or return a new native tree; the result must have mirrored topology and the corresponding original values. Original node identity is not required."
        : constraint,
    ),
    slug: "return-mirrored-native-tree",
    title: "Return the mirrored tree",
    step: 2,
    skillIds: ["trees.child-exchange", "trees.mirrored-topology"],
    prerequisites: ["trees.child-links"],
    checkpointIds: ["trees-07"],
    remedialIds: ["trees-01"],
    nextIds: ["trees-05", "trees-06"],
    objective:
      "Exchange left and right structure at every node, preserving the corresponding node values and sparse topology.",
    rationale:
      "Mirroring applies throughout every subtree; swapping only the root children leaves deeper structure wrong.",
    statement:
      "## Mirror the structure\n\nReturn a tree in which every original node position has its left and right subtrees exchanged, recursively throughout the tree. Keep the corresponding values. Missing children must also exchange sides. An empty tree returns null.\n\n## Mutation and result rules\n\nYou may change input child links or build a new native tree. This task checks result values and topology, not original node identity. Return a native TreeNode root, not an array. Do not delete runner-owned input nodes or redeclare the supplied class.\n\n" +
      note,
    interface:
      "Solution.solve(root) receives TreeNode and returns TreeNode; the wrapper displays compact breadth-first result values.",
    outputSchema: {
      kind: "array",
      maxLength: 4001,
      trimTrailingNulls: true,
      items: { kind: "nullable", value: integer },
    },
    function: {
      arguments: [{ name: "root", type: "TreeNode" }],
      returnType: "TreeNode",
    },
    visible: [
      {
        input: { root: [1, 2, 3, 4, null, 5, 6] },
        expected: [1, 3, 2, 6, 5, null, 4],
        explanation:
          "Exchange children at the root and again inside both subtrees.",
      },
      {
        input: { root: [1, null, 2, null, 3] },
        expected: [1, 2, null, 3],
        explanation:
          "The rightward chain becomes a leftward chain, preserving missing child slots.",
      },
      {
        input: { root: [] },
        expected: [],
        explanation: "A null root remains null in the displayed result.",
      },
    ],
    oracle: mirror,
    independent: mirrorIndexed,
    mutations: {
      "exchange-root-only": ({ root }) => {
        const tree = decode(root);
        if (tree) [tree.left, tree.right] = [tree.right, tree.left];
        return encode(tree);
      },
      "reverse-flat-values": ({ root }) =>
        root.filter((v) => v !== null).reverse(),
    },
    languages: refs(
      "class Solution {public TreeNode solve(TreeNode root){ArrayDeque<TreeNode> stack=new ArrayDeque<>();if(root!=null)stack.push(root);while(!stack.isEmpty()){TreeNode n=stack.pop(),old=n.left;n.left=n.right;n.right=old;if(n.left!=null)stack.push(n.left);if(n.right!=null)stack.push(n.right);}return root;}}",
      "class Solution {public:TreeNode* solve(TreeNode* root){vector<TreeNode*> stack;if(root)stack.push_back(root);while(!stack.empty()){auto n=stack.back();stack.pop_back();swap(n->left,n->right);if(n->left)stack.push_back(n->left);if(n->right)stack.push_back(n->right);}return root;}};",
      "class Solution:\n    def solve(self, root):\n        stack=[] if root is None else [root]\n        while stack:\n            node=stack.pop()\n            node.left,node.right=node.right,node.left\n            if node.left is not None:\n                stack.append(node.left)\n            if node.right is not None:\n                stack.append(node.right)\n        return root\n",
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
      "Trees05–08 author source and canonical candidates only; central materialization/reference execution pending",
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
        report.failures.push(
          d.id + ": mismatch " + JSON.stringify(c.input).slice(0, 100),
        );
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
    "docs/release-evidence/content-trees-next-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-next-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-next.mjs")) audit();
