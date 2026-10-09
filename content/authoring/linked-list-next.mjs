import {statements} from "./linked-list-prose.mjs";
import { preparations } from "./linked-list-next-preparation.mjs";
import { materializePack, logicalCases } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const values = { kind: "array", maxLength: 2000, items: integer };
const nodeIndex = {
  kind: "nullable",
  value: { kind: "integer", minimum: 0, maximum: 1999 },
};
const links = { kind: "array", maxLength: 2000, items: nodeIndex };
const digit = { kind: "integer", minimum: 0, maximum: 9 };
const digits = { kind: "array", minLength: 1, maxLength: 2000, items: digit };
const table = (heads, random = false) => ({
  kind: "object",
  properties: {
    data: {
      kind: "object",
      properties: {
        values,
        next: links,
        ...(random ? { random: links } : {}),
        heads: {
          kind: "array",
          minLength: heads,
          maxLength: heads,
          items: nodeIndex,
        },
      },
    },
  },
});
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-next.mjs",
};
export const definitions = [
  {
    ...preparations[0],
    ...common,
    slug: "first-shared-original-list-node",
    skillIds: ["list.shared-tail-identity", "list.align-chain-lengths"],
    checkpointIds: ["linked-list-06"],
    remedialIds: ["linked-list-03", "linked-list-02"],
    nextIds: ["linked-list-07"],
    rationale:
      "Equal values never imply shared nodes. Aligning native chain lengths identifies the first common object in the shared suffix.",
    statement: statements["linked-list-05"],
    constraints: [
      "0 ≤ data.values.length ≤ 2,000; values lie in [-1,000,000,1,000,000].",
      "next has one nullable bounded index per node; heads contains exactly two nullable bounded indexes.",
      "Both next chains are finite and acyclic; every original node is reachable from at least one head.",
      "Chains may be identical, disjoint, share a suffix, or have a null head.",
    ],
    interface:
      "Solution.solve(data) receives IdentityList and returns an original ListNode or null.",
    inputSchema: table(2),
    outputSchema: nodeIndex,
    semanticConstraints: [
      {
        kind: "node-table",
        field: "data",
        links: ["next"],
        heads: "heads",
        requireReachable: true,
        acyclicLinks: ["next"],
      },
    ],
    function: {
      arguments: [{ name: "data", type: "IdentityList" }],
      returnType: "ListNodeIdentity",
      readOnlyNodes: true,
    },
    languages: refs(
      "class Solution {public ListNode solve(IdentityList data){ListNode a=data.heads[0],b=data.heads[1];int x=0,y=0;for(ListNode p=a;p!=null;p=p.next)x++;for(ListNode p=b;p!=null;p=p.next)y++;while(x>y){a=a.next;x--;}while(y>x){b=b.next;y--;}while(a!=b){a=a.next;b=b.next;}return a;}}",
      "class Solution {public:ListNode* solve(IdentityList data){auto a=data.heads[0];auto b=data.heads[1];int x=0,y=0;for(auto p=a;p;p=p->next)x++;for(auto p=b;p;p=p->next)y++;while(x>y){a=a->next;x--;}while(y>x){b=b->next;y--;}while(a!=b){a=a->next;b=b->next;}return a;}};",
      "class Solution:\n    def solve(self, data):\n        a,b=data.heads\n        x=y=0\n        p=a\n        while p is not None:\n            x+=1\n            p=p.next\n        p=b\n        while p is not None:\n            y+=1\n            p=p.next\n        while x>y:\n            a=a.next\n            x-=1\n        while y>x:\n            b=b.next\n            y-=1\n        while a is not b:\n            a=a.next\n            b=b.next\n        return a\n",
    ),
  },
  {
    ...preparations[1],
    ...common,
    slug: "add-least-significant-first-digit-lists",
    skillIds: ["list.digit-carry", "list.result-chain-building"],
    checkpointIds: ["linked-list-05"],
    remedialIds: ["linked-list-01", "linked-list-02"],
    nextIds: ["linked-list-08"],
    rationale:
      "The last carry can extend a result beyond both input lengths; canonical zero must also survive redundant input zero nodes.",
    statement: statements["linked-list-06"],
    constraints: [
      "1 ≤ left.length and right.length ≤ 2,000.",
      "Every input/output digit lies in [0,9].",
      "Inputs are finite and acyclic; most-significant leading zero nodes are allowed.",
      "Output must be finite, have at most 2,001 nodes, and have no final most-significant zero except singleton [0].",
    ],
    interface:
      "Solution.solve(left,right) receives two native ListNode heads and returns a native ListNode head.",
    inputSchema: {
      kind: "object",
      properties: { left: digits, right: digits },
    },
    outputSchema: { ...digits, maxLength: 2001 },
    function: {
      arguments: [
        { name: "left", type: "ListNode" },
        { name: "right", type: "ListNode" },
      ],
      returnType: "ListNode",
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode left,ListNode right){ListNode dummy=new ListNode(0),tail=dummy;int carry=0;while(left!=null||right!=null||carry!=0){int sum=carry+(left==null?0:left.val)+(right==null?0:right.val);tail.next=new ListNode(sum%10);tail=tail.next;carry=sum/10;if(left!=null)left=left.next;if(right!=null)right=right.next;}ListNode lastNonzero=null;for(ListNode p=dummy.next;p!=null;p=p.next)if(p.val!=0)lastNonzero=p;if(lastNonzero==null)return new ListNode(0);lastNonzero.next=null;return dummy.next;}}",
      "class Solution {public:ListNode* solve(ListNode* left,ListNode* right){ListNode dummy(0);auto tail=&dummy;int carry=0;while(left||right||carry){int sum=carry+(left?left->val:0)+(right?right->val:0);tail->next=new ListNode(sum%10);tail=tail->next;carry=sum/10;if(left)left=left->next;if(right)right=right->next;}ListNode* lastNonzero=nullptr;for(auto p=dummy.next;p;p=p->next)if(p->val!=0)lastNonzero=p;if(!lastNonzero){auto p=dummy.next;while(p){auto n=p->next;delete p;p=n;}return new ListNode(0);}auto discarded=lastNonzero->next;lastNonzero->next=nullptr;while(discarded){auto n=discarded->next;delete discarded;discarded=n;}return dummy.next;}};",
      "class Solution:\n    def solve(self, left, right):\n        dummy=ListNode(0)\n        tail=dummy\n        carry=0\n        while left is not None or right is not None or carry:\n            total=carry+(left.val if left is not None else 0)+(right.val if right is not None else 0)\n            tail.next=ListNode(total%10)\n            tail=tail.next\n            carry=total//10\n            if left is not None:\n                left=left.next\n            if right is not None:\n                right=right.next\n        last_nonzero=None\n        cursor=dummy.next\n        while cursor is not None:\n            if cursor.val!=0:\n                last_nonzero=cursor\n            cursor=cursor.next\n        if last_nonzero is None:\n            return ListNode(0)\n        last_nonzero.next=None\n        return dummy.next\n",
    ),
  },
  {
    ...preparations[2],
    ...common,
    slug: "clone-next-random-rooted-topology",
    skillIds: ["list.clone-identity-map", "list.preserve-random-aliases"],
    checkpointIds: ["linked-list-08"],
    remedialIds: ["linked-list-03", "arrays-hashing-03"],
    nextIds: [],
    rationale:
      "A mapping from original objects to newly allocated objects preserves cycles and aliases without confusing equal-valued nodes.",
    statement: statements["linked-list-07"],
    constraints: [
      "0 ≤ data.values.length ≤ 2,000; values lie in [-1,000,000,1,000,000].",
      "next and random each contain one nullable bounded index per node; heads contains exactly one nullable bounded index.",
      "Every supplied node is reachable from the root across next/random; the empty table has a null root.",
      "Cycles, self-links, duplicate values and shared next/random targets are allowed.",
    ],
    interface:
      "Solution.solve(data) receives IdentityList and returns a newly allocated native ListNode root or null; the wrapper serializes CloneList topology.",
    inputSchema: table(1, true),
    outputSchema: {
      kind: "object",
      properties: {
        values,
        next: links,
        random: links,
        head: nodeIndex,
        aliasesOriginal: { kind: "boolean" },
      },
    },
    semanticConstraints: [
      {
        kind: "node-table",
        field: "data",
        links: ["next", "random"],
        heads: "heads",
        requireReachable: true,
      },
    ],
    function: {
      arguments: [{ name: "data", type: "IdentityList" }],
      returnType: "CloneList",
      readOnlyNodes: true,
    },
    languages: refs(
      "class Solution {public ListNode solve(IdentityList data){ListNode head=data.heads[0];if(head==null)return null;IdentityHashMap<ListNode,ListNode> copy=new IdentityHashMap<>();ArrayList<ListNode> queue=new ArrayList<>();copy.put(head,new ListNode(head.val));queue.add(head);for(int i=0;i<queue.size();i++){ListNode node=queue.get(i);for(ListNode child:new ListNode[]{node.next,node.random})if(child!=null&&!copy.containsKey(child)){copy.put(child,new ListNode(child.val));queue.add(child);}ListNode clone=copy.get(node);clone.next=node.next==null?null:copy.get(node.next);clone.random=node.random==null?null:copy.get(node.random);}return copy.get(head);}}",
      "class Solution {public:ListNode* solve(IdentityList data){auto head=data.heads[0];if(!head)return nullptr;unordered_map<ListNode*,ListNode*> copy;vector<ListNode*> queue{head};copy[head]=new ListNode(head->val);for(size_t i=0;i<queue.size();i++){auto node=queue[i];for(auto child:{node->next,node->random})if(child&&!copy.count(child)){copy[child]=new ListNode(child->val);queue.push_back(child);}auto clone=copy[node];clone->next=node->next?copy.at(node->next):nullptr;clone->random=node->random?copy.at(node->random):nullptr;}return copy.at(head);}};",
      "class Solution:\n    def solve(self, data):\n        head=data.heads[0]\n        if head is None:\n            return None\n        copies={head:ListNode(head.val)}\n        queue=[head]\n        for node in queue:\n            for child in (node.next,node.random):\n                if child is not None and child not in copies:\n                    copies[child]=ListNode(child.val)\n                    queue.append(child)\n            clone=copies[node]\n            clone.next=None if node.next is None else copies[node.next]\n            clone.random=None if node.random is None else copies[node.random]\n        return copies[head]\n",
    ),
  },
  {
    ...preparations[3],
    ...common,
    slug: "reverse-complete-native-list-groups",
    skillIds: ["list.complete-group-boundary", "list.group-link-reversal"],
    checkpointIds: ["linked-list-07"],
    remedialIds: ["linked-list-01", "linked-list-02"],
    nextIds: [],
    rationale:
      "Before reversing links, establish that a complete group exists; otherwise preserve the remaining tail.",
    statement: statements["linked-list-08"],
    constraints: [
      "0 ≤ head.length ≤ 2,000; signed values lie in [-1,000,000,1,000,000].",
      "1 ≤ k ≤ 2,001.",
      "The input is finite and acyclic; duplicate values are allowed.",
      "The returned sequence has exactly the original length, and incomplete trailing groups remain unchanged.",
    ],
    interface:
      "Solution.solve(head,k) receives ListNode and int and returns ListNode.",
    inputSchema: {
      kind: "object",
      properties: {
        head: values,
        k: { kind: "integer", minimum: 1, maximum: 2001 },
      },
    },
    outputSchema: values,
    function: {
      arguments: [
        { name: "head", type: "ListNode" },
        { name: "k", type: "int" },
      ],
      returnType: "ListNode",
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head,int k){ListNode dummy=new ListNode(0,head),before=dummy;while(true){ListNode end=before;for(int i=0;i<k&&end!=null;i++)end=end.next;if(end==null)break;ListNode after=end.next,first=before.next,prev=after,current=first;while(current!=after){ListNode following=current.next;current.next=prev;prev=current;current=following;}before.next=end;before=first;}return dummy.next;}}",
      "class Solution {public:ListNode* solve(ListNode* head,int k){ListNode dummy(0,head);auto before=&dummy;while(true){auto end=before;for(int i=0;i<k&&end;i++)end=end->next;if(!end)break;auto after=end->next;auto first=before->next;auto prev=after;auto current=first;while(current!=after){auto following=current->next;current->next=prev;prev=current;current=following;}before->next=end;before=first;}return dummy.next;}};",
      "class Solution:\n    def solve(self, head, k):\n        dummy=ListNode(0,head)\n        before=dummy\n        while True:\n            end=before\n            for _ in range(k):\n                end=end.next\n                if end is None:\n                    return dummy.next\n            after=end.next\n            first=before.next\n            previous=after\n            current=first\n            while current is not after:\n                following=current.next\n                current.next=previous\n                previous=current\n                current=following\n            before.next=end\n            before=first\n",
    ),
  },
];
// R21: explicit one-step progression targets now exist in the materialized bank.
definitions.find(def => def.id === 'linked-list-07').nextIds = ["linked-list-09"];
definitions.find(def => def.id === 'linked-list-08').nextIds = ["linked-list-10"];

export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "LL05–08 materialized authored drafts, trusted JS oracle/mutation checks only",
    referenceRuntime: "not-run",
    published: 0,
    packs: [],
    failures: [],
  };
  for (const def of definitions) {
    const cases = logicalCases(def);
    for (const c of [...def.visible, ...cases])
      if (
        JSON.stringify(def.oracle(c.input)) !==
        JSON.stringify(def.independent(c.input))
      )
        report.failures.push(def.id + ": mismatch");
    const mutations = Object.entries(def.mutations).map(([name, fn]) => ({
      name,
      detected: cases.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(def.id + ": mutation " + m.name);
    report.packs.push({
      id: def.id,
      hidden: cases.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-next-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
  console.log(report);
}
if (process.argv[1]?.endsWith("linked-list-next.mjs")) {
  for (const def of definitions) console.log(await materializePack(def));
  audit();
}
