import { definitions as foundation } from "./trees-first.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
import { inputKey } from "../../packages/judge-adapter/src/canonical.mjs";
function nodes(values) {
  const map = new Map();
  if (!values.length || values[0] === null) return map;
  map.set(0, {
    index: 0,
    val: values[0],
    left: null,
    right: null,
    parent: null,
  });
  const queue = [0];
  let at = 1;
  for (const index of queue)
    for (const side of ["left", "right"]) {
      if (at === values.length) break;
      const slot = at++,
        value = values[slot];
      if (value !== null) {
        map.get(index)[side] = slot;
        map.set(slot, {
          index: slot,
          val: value,
          left: null,
          right: null,
          parent: index,
        });
        queue.push(slot);
      }
    }
  return map;
}
function ancestor({ data }, byValues = false) {
  const map = nodes(data.values);
  let [a, b] = data.targetIndices;
  if (byValues) {
    const valueA = map.get(a).val,
      valueB = map.get(b).val;
    a = [...map.values()].find((n) => n.val === valueA).index;
    b = [...map.values()].find((n) => n.val === valueB).index;
  }
  const ancestors = new Set();
  for (let node = a; node !== null; node = map.get(node).parent)
    ancestors.add(node);
  for (let node = b; node !== null; node = map.get(node).parent)
    if (ancestors.has(node)) return node;
  throw Error("Invalid authored target pair");
}
function subtreeMask({ data }) {
  const map = nodes(data.values),
    order = [0],
    mask = new Map();
  for (const index of order) {
    const node = map.get(index);
    if (node.left !== null) order.push(node.left);
    if (node.right !== null) order.push(node.right);
  }
  for (const index of order.reverse()) {
    const node = map.get(index),
      bits =
        (index === data.targetIndices[0] ? 1 : 0) |
        (index === data.targetIndices[1] ? 2 : 0) |
        (mask.get(node.left) || 0) |
        (mask.get(node.right) || 0);
    if (bits === 3) return index;
    mask.set(index, bits);
  }
  throw Error("Invalid authored target pair");
}
function cases() {
  const out = [];
  for (const [i, c] of foundation[0].generate().entries()) {
    const indices = [...nodes(c.input.root).keys()];
    if (!indices.length) continue;
    const a = i % 4 === 0 ? 0 : indices[Math.floor(indices.length / 3)],
      b = i % 4 === 1 ? a : indices.at(-1);
    out.push({
      input: { data: { values: [...c.input.root], targetIndices: [a, b] } },
      category:
        i % 4 === 1 ? "same-original-target-twice" : "native-ancestor-query",
    });
  }
  for (const values of [
    [5, 5, 5, 5, 5, 5, 5],
    [1, 2, 3, null, 4],
    [9, 9, 9, null, 9, null, 9],
  ]) {
    const indices = [...nodes(values).keys()];
    for (const a of indices)
      for (const b of indices)
        out.push({
          input: { data: { values, targetIndices: [a, b] } },
          category: "duplicate-values-sparse-original-slot-pairs",
        });
  }
  return out;
}
const rootSchema = {
  ...foundation[0].inputSchema.properties.root,
  minLength: 1,
};
const d = {
  id: "trees-17",
  slug: "lowest-common-original-native-ancestor",
  title: "Find the lowest common ancestor by object identity",
  primaryTopic: "trees",
  step: 4,
  skillIds: [
    "trees.child-links",
    "trees.node-visitation",
    "trees.original-query-identity",
    "trees.common-ancestor-chain",
  ],
  prerequisites: ["trees.child-links", "trees.node-visitation"],
  remedialIds: ["trees-01"],
  checkpointIds: ["trees-14", "trees-15", "trees-24"],
  nextIds: ["trees-12", "trees-28", "trees-29", "trees-30"],
  objective:
    "Return the deepest original node that is an ancestor of both native target objects, allowing repeated values and identical targets.",
  rationale:
    "A parent map or subtree membership combines object identities rather than values; a target is its own ancestor.",
  statement:
    "## Lowest common original ancestor\n\nReturn the lowest common ancestor of the two target objects in the supplied tree. An ancestor includes the node itself. Lowest means deepest: choose the original node farthest from the root that is an ancestor of both targets. Both targets are guaranteed to be original non-null nodes in this one tree. They may be the same object; then return that object. If one target is an ancestor of the other, return that ancestor.\n\nNode values may repeat and do not identify the targets. Return the actual original TreeNode object, not its value or a copied node. Preserve all original values and links.\n\n### Native interface\n\n`solve(data)` receives an IdentityTree object. `data.root` is the genuine TreeNode root and `data.targets` contains two genuine references into that same tree. Nodes have val, left, and right; missing children are null. The runner supplies the classes and builds the links and target references; do not redeclare them or parse a table.\n\n### Representation and identity notes\n\nExamples describe data with a compact breadth-first values array and targetIndices selecting its non-null original slots. Null child slots still occupy positions in that display. The output shows the original array slot of the returned node, but your return type is the native TreeNode object. Your function does not receive integer target indices.",
  constraints: [
    "The tree contains 1 to 2,000 native nodes.",
    "Values lie in [-1,000,000,000,1,000,000,000] and may repeat.",
    "Both targets are original non-null nodes in the same tree; the same node may be supplied twice.",
    "The tree is finite and original values/links remain unchanged.",
  ],
  interface:
    "Solution.solve(data) receives IdentityTree and returns an original TreeNode.",
  inputSchema: {
    kind: "object",
    properties: {
      data: {
        kind: "object",
        properties: {
          values: rootSchema,
          targetIndices: {
            kind: "array",
            unordered: true,
            minLength: 2,
            maxLength: 2,
            items: { kind: "integer", minimum: 0, maximum: 4000 },
          },
        },
      },
    },
  },
  semanticConstraints: [
    { kind: "identity-tree", field: "data", maxNodes: 2000, targetCount: 2 },
  ],
  valid: (input) => validateSemantics(d.semanticConstraints, input),
  outputSchema: { kind: "integer", minimum: 0, maximum: 4000 },
  function: {
    arguments: [{ name: "data", type: "IdentityTree" }],
    returnType: "TreeNodeIdentity",
    readOnlyNodes: true,
  },
  generatorModule: "content/authoring/trees-native-ancestor.mjs",
  generate: cases,
  visible: [
    {
      input: { data: { values: [5, 5, 5, 5, 5, 5, 5], targetIndices: [3, 4] } },
      expected: 1,
      explanation:
        "The two equal-valued targets are the children of original slot 1. Their value 5 cannot distinguish them from any other node.",
    },
    {
      input: { data: { values: [1, 2, 3, null, 4], targetIndices: [1, 4] } },
      expected: 1,
      explanation:
        "The target at slot 1 is already an ancestor of the target at slot 4, so it is the lowest common ancestor.",
    },
    {
      input: { data: { values: [9, 9, 9], targetIndices: [2, 2] } },
      expected: 2,
      explanation:
        "Both target references are the same original right-child object; return that object.",
    },
  ],
  oracle: ancestor,
  independent: subtreeMask,
  mutations: {
    "locate-targets-by-value-not-identity": (input) => ancestor(input, true),
    "always-return-root": () => 0,
  },
  languages: {
    java: {
      starter: "GENERATE",
      reference:
        "class Solution {public TreeNode solve(IdentityTree data){IdentityHashMap<TreeNode,TreeNode> parent=new IdentityHashMap<>();ArrayList<TreeNode> queue=new ArrayList<>();queue.add(data.root);parent.put(data.root,null);for(int i=0;i<queue.size();i++){TreeNode node=queue.get(i);if(node.left!=null){parent.put(node.left,node);queue.add(node.left);}if(node.right!=null){parent.put(node.right,node);queue.add(node.right);}}Set<TreeNode> ancestors=Collections.newSetFromMap(new IdentityHashMap<>());for(TreeNode node=data.targets[0];node!=null;node=parent.get(node))ancestors.add(node);for(TreeNode node=data.targets[1];node!=null;node=parent.get(node))if(ancestors.contains(node))return node;return null;}}",
    },
    cpp: {
      starter: "GENERATE",
      reference:
        "class Solution {public:TreeNode* solve(IdentityTree data){unordered_map<TreeNode*,TreeNode*> parent{{data.root,nullptr}};vector<TreeNode*> queue{data.root};for(size_t i=0;i<queue.size();i++){auto node=queue[i];if(node->left){parent[node->left]=node;queue.push_back(node->left);}if(node->right){parent[node->right]=node;queue.push_back(node->right);}}unordered_set<TreeNode*> ancestors;for(auto node=data.targets[0];node;node=parent.at(node))ancestors.insert(node);for(auto node=data.targets[1];node;node=parent.at(node))if(ancestors.count(node))return node;return nullptr;}};",
    },
    python: {
      starter: "GENERATE",
      reference:
        "class Solution:\n    def solve(self, data):\n        parent={data.root:None}\n        queue=[data.root]\n        for node in queue:\n            if node.left is not None:\n                parent[node.left]=node\n                queue.append(node.left)\n            if node.right is not None:\n                parent[node.right]=node\n                queue.append(node.right)\n        ancestors=set()\n        node=data.targets[0]\n        while node is not None:\n            ancestors.add(node)\n            node=parent[node]\n        node=data.targets[1]\n        while node is not None:\n            if node in ancestors:\n                return node\n            node=parent[node]\n        return None\n",
    },
  },
};
export const definitions = [d];
const starters = buildFunctionStarters(d.function);
for (const language of ["java", "cpp", "python"])
  d.languages[language].starter = starters[language];
export function audit() {
  const hidden = logicalCases(d),
    report = {
      timestamp: new Date().toISOString(),
      scope:
        "Tree17 source-only native-target author model audit; no reference execution",
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations: [],
      failures: [],
    };
  report.swappedTargetRegressions = [...d.visible, ...hidden.slice(0, 5)].map(
    (c) => {
      const swapped = {
        data: {
          ...c.input.data,
          targetIndices: [...c.input.data.targetIndices].reverse(),
        },
      };
      return {
        targets: c.input.data.targetIndices,
        passed:
          ancestor(c.input) === ancestor(swapped) &&
          subtreeMask(c.input) === subtreeMask(swapped) &&
          inputKey(d.inputSchema, c.input) === inputKey(d.inputSchema, swapped),
        countedAsHidden: false,
      };
    },
  );
  report.distinctValueErasedTopologyQueries = new Set(
    hidden.map((c) => {
      const values = c.input.data.values.map((v) => (v === null ? null : 1));
      while (values.at(-1) === null) values.pop();
      return JSON.stringify({
        values,
        targets: [...c.input.data.targetIndices].sort((a, b) => a - b),
      });
    }),
  ).size;
  report.pairMultiplicityPreserved =
    d.inputSchema.properties.data.properties.targetIndices.deduplicate !==
      true &&
    d.inputSchema.properties.data.properties.targetIndices.minLength === 2;
  if (
    report.swappedTargetRegressions.some((r) => !r.passed) ||
    report.distinctValueErasedTopologyQueries < 200 ||
    !report.pairMultiplicityPreserved
  )
    report.failures.push(
      "target-pair canonical/structural diversity regression",
    );
  for (const c of [...d.visible, ...hidden]) {
    const result = d.oracle(c.input);
    if (!d.valid(c.input)) report.failures.push("semantic invalid");
    if (result !== d.independent(c.input))
      report.failures.push("independent mismatch");
    if (c.expected !== undefined && result !== c.expected)
      report.failures.push("expected mismatch");
  }
  report.mutations = Object.entries(d.mutations).map(([name, fn]) => ({
    name,
    detected: hidden.some((c) => fn(c.input) !== c.expected),
  }));
  for (const m of report.mutations)
    if (!m.detected) report.failures.push("mutation " + m.name);
  writeFileSync(
    "docs/release-evidence/content-trees-native-ancestor-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-trees-native-ancestor-template-sources.json",
    JSON.stringify([
      {
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      },
    ]),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("trees-native-ancestor.mjs")) audit();
