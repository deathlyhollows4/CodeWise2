import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
function decode(values) {
  if (!values.length || values[0] === null) return null;
  const root = { val: values[0], left: null, right: null },
    queue = [root];
  let at = 1;
  for (const n of queue)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const value = values[at++];
      if (value !== null) {
        n[side] = { val: value, left: null, right: null };
        queue.push(n[side]);
      }
    }
  return root;
}
function topology(root) {
  const tree = decode(root),
    nodes = tree ? [tree] : [],
    index = new Map(),
    edges = [];
  for (const n of nodes) {
    index.set(n, index.size);
    edges.push([]);
    if (n.left) nodes.push(n.left);
    if (n.right) nodes.push(n.right);
  }
  for (const n of nodes)
    for (const child of [n.left, n.right])
      if (child) {
        const a = index.get(n),
          b = index.get(child);
        edges[a].push(b);
        edges[b].push(a);
      }
  return { nodes, index, edges };
}
function independentSet({ root }, forceRoot = false, wrap32 = false) {
  const { nodes } = topology(root),
    state = new Map();
  for (const n of [...nodes].reverse()) {
    const a = state.get(n.left) || [0, 0],
      b = state.get(n.right) || [0, 0];
    let take = n.val + a[1] + b[1],
      skip = Math.max(...a) + Math.max(...b);
    if (wrap32) {
      take |= 0;
      skip |= 0;
    }
    state.set(n, [take, skip]);
  }
  if (!nodes.length) return 0;
  return forceRoot ? state.get(nodes[0])[0] : Math.max(...state.get(nodes[0]));
}
function independentCut({ root }) {
  const { nodes, edges } = topology(root),
    n = nodes.length;
  if (!n) return 0;
  const source = n,
    sink = n + 1,
    residual = Array.from({ length: n + 2 }, () => []),
    colors = Array(n).fill(-1),
    q = [0];
  colors[0] = 0;
  for (const at of q)
    for (const next of edges[at])
      if (colors[next] === -1) {
        colors[next] = colors[at] ^ 1;
        q.push(next);
      }
  let total = 0;
  const positive = nodes.map((node) => {
    const v = Math.max(0, node.val);
    total += v;
    return v;
  });
  const add = (a, b, capacity) => {
    const x = { to: b, rev: residual[b].length, capacity },
      y = { to: a, rev: residual[a].length, capacity: 0 };
    residual[a].push(x);
    residual[b].push(y);
  };
  for (let i = 0; i < n; i++) {
    if (colors[i] === 0) {
      add(source, i, positive[i]);
      for (const j of edges[i]) add(i, j, total + 1);
    } else add(i, sink, positive[i]);
  }
  let flow = 0;
  while (true) {
    const parent = Array(n + 2).fill(null),
      queue = [source];
    parent[source] = { from: -1, edge: -1 };
    for (let at = 0; at < queue.length && !parent[sink]; at++) {
      const u = queue[at];
      for (let e = 0; e < residual[u].length; e++) {
        const arc = residual[u][e];
        if (arc.capacity > 0 && parent[arc.to] === null) {
          parent[arc.to] = { from: u, edge: e };
          queue.push(arc.to);
        }
      }
    }
    if (!parent[sink]) break;
    let amount = Infinity;
    for (let v = sink; v !== source; v = parent[v].from) {
      const p = parent[v];
      amount = Math.min(amount, residual[p.from][p.edge].capacity);
    }
    for (let v = sink; v !== source; v = parent[v].from) {
      const p = parent[v],
        arc = residual[p.from][p.edge];
      arc.capacity -= amount;
      residual[v][arc.rev].capacity += amount;
    }
    flow += amount;
  }
  return total - flow;
}
function independentBrute({ root }) {
  const { nodes, edges } = topology(root);
  let best = 0;
  for (let mask = 0; mask < 2 ** nodes.length; mask++) {
    let okay = true,
      sum = 0;
    for (let i = 0; i < nodes.length && okay; i++)
      if (mask & (1 << i)) {
        sum += nodes[i].val;
        for (const j of edges[i])
          if (j > i && mask & (1 << j)) {
            okay = false;
            break;
          }
      }
    if (okay) best = Math.max(best, sum);
  }
  return best;
}
function independentCases() {
  const out = foundation[0].generate();
  for (const root of [
    [4, 5, 6],
    [3, 2, 3, null, 3, null, 1],
    [-3, -2, -5],
    [1000000000, -1000000000, 1000000000, 1000000000, 1000000000],
    [0, 0, 0],
  ])
    out.push({
      input: { root },
      category: "adjacency-negative-empty-and-weighted-counterexamples",
    });
  const chain = [];
  for (let i = 0; i < 2000; i++) {
    chain.push(1000000000);
    if (i < 1999) chain.push(null);
  }
  out.push({
    input: { root: chain },
    category: "maximum-skew-wide-independent-total",
  });
  return out;
}
function reroot({ root }, wrongFactor = false, allRoot = false) {
  const { nodes, index } = topology(root),
    n = nodes.length;
  if (!n) return [];
  const size = Array(n).fill(1),
    depth = Array(n).fill(0),
    answers = Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (const child of [nodes[i].left, nodes[i].right])
      if (child) depth[index.get(child)] = depth[i] + 1;
  answers[0] = depth.reduce((a, b) => a + b, 0);
  for (let i = n - 1; i >= 0; i--)
    for (const child of [nodes[i].left, nodes[i].right])
      if (child) size[i] += size[index.get(child)];
  for (let i = 0; i < n; i++)
    for (const child of [nodes[i].left, nodes[i].right])
      if (child) {
        const j = index.get(child);
        answers[j] = allRoot
          ? answers[0]
          : answers[i] + n - (wrongFactor ? 1 : 2) * size[j];
      }
  return answers;
}
function rerootIndependent({ root }) {
  const { nodes, edges } = topology(root);
  return nodes.map((_, start) => {
    const q = [[start, -1, 0]];
    let total = 0;
    for (const [at, parent, distance] of q) {
      total += distance;
      for (const next of edges[at])
        if (next !== parent) q.push([next, at, distance + 1]);
    }
    return total;
  });
}
function rerootCases() {
  const out = foundation[0].generate();
  for (const root of [
    [0, 0, 0, null, 0],
    [7, 7, 7, 7, 7],
    [-1000000000, 1000000000],
    [1, null, 2, null, 3, null, 4],
  ])
    out.push({
      input: { root },
      category: "equal-values-sparse-and-unweighted-distance",
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
  generatorModule: "content/authoring/trees-independent-reroot.mjs",
  inputSchema: foundation[0].inputSchema,
  semanticConstraints: [{ kind: "tree-level", field: "root", maxNodes: 2000 }],
  constraints: foundation[0].constraints,
  function: {
    arguments: [{ name: "root", type: "TreeNode" }],
    returnType: "long",
    readOnlyNodes: true,
  },
};
const native =
  "## Native interface\n\n`solve(root)` receives a genuine TreeNode root. Nodes have `val`, `left`, and `right`; missing children and an empty root are null. Preserve all original values and links. The runner supplies the class and constructs the tree; do not redeclare TreeNode or write a parser.\n\n### Representation note\n\nExamples use compact breadth-first arrays with null child slots and no trailing nulls. Child slots are read for existing parents in queue order; your argument is the native root.";
export const definitions = [
  {
    ...common,
    id: "trees-29",
    slug: "maximum-weight-nonadjacent-tree-node-set",
    title: "Choose a maximum-weight nonadjacent node set",
    step: 5,
    skillIds: [
      "trees.child-links",
      "numbers.signed-accumulation",
      "trees.include-exclude-subtree-state",
      "trees.parent-child-selection-conflict",
    ],
    prerequisites: ["trees.child-links", "numbers.signed-accumulation"],
    remedialIds: ["trees-01", "arrays-hashing-01"],
    checkpointIds: ["trees-12", "trees-28", "trees-30"],
    nextIds: [],
    objective:
      "Maximize the total value of a selected original-node set containing no parent-child pair; allow the empty selection.",
    rationale:
      "Selecting a node forces both children out, while skipping it lets each child subtree choose independently. Signed weights make empty selection a meaningful alternative.",
    statement:
      "## Select nodes without adjacent pairs\n\nChoose any set of original nodes such that no selected node is the parent or child of another selected node. Maximize the sum of selected node values and return that total. A selected node may coexist with grandchildren and with nodes in other branches. Nodes with equal values are still different nodes.\n\nValues are signed. You may select no nodes, giving total zero; therefore an all-negative tree returns zero. An empty tree also returns zero. The selection need not be connected and does not have to include the root. This is a node-set constraint, not a path or a camera-cover requirement. Use a wide integer for the total.\n\n" +
      native,
    interface: "Solution.solve(root) returns long / long long.",
    outputSchema: { kind: "integer", minimum: 0, maximum: 2000000000000 },
    generate: independentCases,
    visible: [
      {
        input: { root: [3, 2, 3, null, 3, null, 1] },
        expected: 7,
        explanation:
          "Select the root and the two grandchildren with values 3 and 1. Their total is 7 and no selected pair shares an edge.",
      },
      {
        input: { root: [4, 5, 6] },
        expected: 11,
        explanation:
          "Selecting the two children gives 11, more than selecting their parent.",
      },
      {
        input: { root: [-3, -2, -5] },
        expected: 0,
        explanation:
          "The empty selection is allowed and beats every negative selection.",
      },
    ],
    oracle: independentSet,
    independent: independentCut,
    mutations: {
      "force-root-selection": (input) => independentSet(input, true),
      "ignore-adjacency-select-all-positive": ({ root }) =>
        root.reduce((sum, v) => sum + Math.max(0, v ?? 0), 0),
      "signed-int32-selection-total": (input) =>
        independentSet(input, false, true),
    },
    languages: refs(
      "class Solution {public long solve(TreeNode root){if(root==null)return 0;ArrayList<TreeNode> order=new ArrayList<>();order.add(root);for(int i=0;i<order.size();i++){TreeNode n=order.get(i);if(n.left!=null)order.add(n.left);if(n.right!=null)order.add(n.right);}IdentityHashMap<TreeNode,long[]> state=new IdentityHashMap<>();for(int i=order.size()-1;i>=0;i--){TreeNode n=order.get(i);long[] a=n.left==null?new long[]{0,0}:state.get(n.left),b=n.right==null?new long[]{0,0}:state.get(n.right);long take=(long)n.val+a[1]+b[1],skip=Math.max(a[0],a[1])+Math.max(b[0],b[1]);state.put(n,new long[]{take,skip});}long[] result=state.get(root);return Math.max(result[0],result[1]);}}",
      "class Solution {public:long long solve(TreeNode* root){if(!root)return 0;vector<TreeNode*> order{root};for(size_t i=0;i<order.size();i++){auto n=order[i];if(n->left)order.push_back(n->left);if(n->right)order.push_back(n->right);}unordered_map<TreeNode*,pair<long long,long long>> state;for(auto i=order.rbegin();i!=order.rend();++i){auto n=*i;auto a=n->left?state.at(n->left):make_pair(0LL,0LL),b=n->right?state.at(n->right):make_pair(0LL,0LL);state[n]={(long long)n->val+a.second+b.second,max(a.first,a.second)+max(b.first,b.second)};}auto result=state.at(root);return max(result.first,result.second);}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return 0\n        order=[root]\n        for node in order:\n            if node.left is not None:\n                order.append(node.left)\n            if node.right is not None:\n                order.append(node.right)\n        state={}\n        for node in reversed(order):\n            a=(0,0) if node.left is None else state[node.left]\n            b=(0,0) if node.right is None else state[node.right]\n            state[node]=(node.val+a[1]+b[1],max(a)+max(b))\n        return max(state[root])\n",
    ),
  },
  {
    ...common,
    id: "trees-30",
    slug: "distance-total-from-every-native-node",
    title: "Compute distance totals from every node",
    step: 5,
    skillIds: [
      "trees.child-links",
      "trees.node-visitation",
      "trees.subtree-size-summary",
      "trees.reroot-distance-transfer",
    ],
    prerequisites: ["trees.child-links", "trees.node-visitation"],
    remedialIds: ["trees-01"],
    checkpointIds: ["trees-12", "trees-28", "trees-29"],
    nextIds: [],
    objective:
      "Return each native node’s total edge distance to every node, in breadth-first existing-node order.",
    rationale:
      "Moving the distance origin across one edge shortens routes to the child subtree and lengthens all others; subtree sizes transfer totals without repeating BFS for each origin.",
    statement:
      "## Distance total for every node\n\nFor each original node, add its edge distance to every node in the tree. A node’s distance to itself is zero. Return all these totals in breadth-first order of existing nodes, visiting a left child before a right child. Skip missing children: there are no null-placeholder entries in the result. An empty root returns an empty array; a singleton returns [0]. Node values, including duplicates and negative values, do not affect distances or ordering.\n\nDistances follow the unique undirected parent-child route, so the origin may travel upward and into another branch. Each edge has length one. Return wide integer totals. Aim to calculate the whole result in O(n) by transferring a total between adjacent origins using subtree sizes.\n\n" +
      native,
    interface:
      "Solution.solve(root) returns long[] / vector<long long> in breadth-first existing-node order.",
    outputSchema: {
      kind: "array",
      maxLength: 2000,
      items: { kind: "integer", minimum: 0, maximum: 1999000 },
    },
    function: { ...common.function, returnType: "long[]" },
    generate: rerootCases,
    visible: [
      {
        input: { root: [1, 2, 3] },
        expected: [2, 3, 3],
        explanation:
          "From the root the distances are 0,1,1. From either child the distances to itself, the root, and its sibling are 0,1,2.",
      },
      {
        input: { root: [7, null, 7, null, 7] },
        expected: [3, 2, 3],
        explanation:
          "The three equal-valued nodes form a chain; breadth-first order still distinguishes their positions.",
      },
      {
        input: { root: [] },
        expected: [],
        explanation: "There is no origin node needing a total.",
      },
    ],
    oracle: reroot,
    independent: rerootIndependent,
    mutations: {
      "miss-double-subtree-distance-change": (input) => reroot(input, true),
      "copy-root-total-to-every-node": (input) => reroot(input, false, true),
    },
    languages: refs(
      "class Solution {public long[] solve(TreeNode root){if(root==null)return new long[0];ArrayList<TreeNode> nodes=new ArrayList<>();IdentityHashMap<TreeNode,Integer> index=new IdentityHashMap<>();nodes.add(root);index.put(root,0);for(int i=0;i<nodes.size();i++){TreeNode n=nodes.get(i);if(n.left!=null){index.put(n.left,nodes.size());nodes.add(n.left);}if(n.right!=null){index.put(n.right,nodes.size());nodes.add(n.right);}}int count=nodes.size();long[] size=new long[count],depth=new long[count],answer=new long[count];Arrays.fill(size,1);for(int i=0;i<count;i++){TreeNode n=nodes.get(i);if(n.left!=null)depth[index.get(n.left)]=depth[i]+1;if(n.right!=null)depth[index.get(n.right)]=depth[i]+1;answer[0]+=depth[i];}for(int i=count-1;i>=0;i--){TreeNode n=nodes.get(i);if(n.left!=null)size[i]+=size[index.get(n.left)];if(n.right!=null)size[i]+=size[index.get(n.right)];}for(int i=0;i<count;i++){TreeNode n=nodes.get(i);if(n.left!=null){int j=index.get(n.left);answer[j]=answer[i]+count-2*size[j];}if(n.right!=null){int j=index.get(n.right);answer[j]=answer[i]+count-2*size[j];}}return answer;}}",
      "class Solution {public:vector<long long> solve(TreeNode* root){if(!root)return {};vector<TreeNode*> nodes{root};unordered_map<TreeNode*,size_t> index{{root,0}};for(size_t i=0;i<nodes.size();i++){auto n=nodes[i];if(n->left){index[n->left]=nodes.size();nodes.push_back(n->left);}if(n->right){index[n->right]=nodes.size();nodes.push_back(n->right);}}long long count=nodes.size();vector<long long> size(count,1),depth(count),answer(count);for(size_t i=0;i<nodes.size();i++){auto n=nodes[i];if(n->left)depth[index.at(n->left)]=depth[i]+1;if(n->right)depth[index.at(n->right)]=depth[i]+1;answer[0]+=depth[i];}for(size_t at=nodes.size();at>0;){size_t i=--at;auto n=nodes[i];if(n->left)size[i]+=size[index.at(n->left)];if(n->right)size[i]+=size[index.at(n->right)];}for(size_t i=0;i<nodes.size();i++){auto n=nodes[i];if(n->left){auto j=index.at(n->left);answer[j]=answer[i]+count-2*size[j];}if(n->right){auto j=index.at(n->right);answer[j]=answer[i]+count-2*size[j];}}return answer;}};",
      "class Solution:\n    def solve(self, root):\n        if root is None:\n            return []\n        nodes=[root]\n        index={root:0}\n        for node in nodes:\n            if node.left is not None:\n                index[node.left]=len(nodes)\n                nodes.append(node.left)\n            if node.right is not None:\n                index[node.right]=len(nodes)\n                nodes.append(node.right)\n        count=len(nodes)\n        size=[1]*count\n        depth=[0]*count\n        answer=[0]*count\n        for i,node in enumerate(nodes):\n            if node.left is not None:\n                depth[index[node.left]]=depth[i]+1\n            if node.right is not None:\n                depth[index[node.right]]=depth[i]+1\n            answer[0]+=depth[i]\n        for i in range(count-1,-1,-1):\n            node=nodes[i]\n            if node.left is not None:\n                size[i]+=size[index[node.left]]\n            if node.right is not None:\n                size[i]+=size[index[node.right]]\n        for i,node in enumerate(nodes):\n            if node.left is not None:\n                j=index[node.left]\n                answer[j]=answer[i]+count-2*size[j]\n            if node.right is not None:\n                j=index[node.right]\n                answer[j]=answer[i]+count-2*size[j]\n        return answer\n",
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
      "Trees29/30 source-only author audit; independent min-cut/BFS models, no language reference execution",
    prepared: [],
    failures: [],
    smallBruteChecked: 0,
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
      if (
        d.id === "trees-29" &&
        c.input.root.filter((v) => v !== null).length <= 12
      ) {
        report.smallBruteChecked++;
        if (result !== independentBrute(c.input))
          report.failures.push(d.id + ": exhaustive mismatch");
      }
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
    "docs/release-evidence/content-trees-independent-reroot-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-independent-reroot-template-sources.json",
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
if (process.argv[1]?.endsWith("trees-independent-reroot.mjs")) audit();
