import { preparations } from "./linked-list-advanced-preparation.mjs";
import { materializePack, logicalCases } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const integer = { kind: "integer", minimum: -1000000, maximum: 1000000 };
const values = { kind: "array", maxLength: 2000, items: integer };
const index = { kind: "integer", minimum: 0, maximum: 1999 };
const indexes = { kind: "array", maxLength: 2000, items: index };
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const common = {
  primaryTopic: "linked-list",
  generatorModule: "content/authoring/linked-list-advanced.mjs",
};
export const definitions = [
  {
    ...preparations[0],
    ...common,
    slug: "original-josephus-survivor",
    skillIds: ["list.circular-elimination", "list.modular-survivor-rank"],
    prerequisites: ["list.walk", "list.original-identity"],
    checkpointIds: ["linked-list-10", "linked-list-11", "linked-list-12"],
    remedialIds: ["linked-list-03", "linked-list-04"],
    nextIds: [],
    rationale:
      "The survivor rank follows a smaller-ring recurrence, but the returned result must still be the original object in the given ring order.",
    statement:
      "## Find the survivor\n\nStarting from the head of a circular list, count nodes beginning at 1. Remove the kth counted node, resume counting at its next node, and repeat until one node remains. Return that original survivor. An empty input returns null.\n\n## Your function\n\n`solve(data, k)` receives an IdentityList and a positive integer. `data.heads[0]` is the native starting ListNode, whose `val` and `next` fields describe its value and circular link. Every supplied node belongs to this single ring. The next table is a permutation: each node has exactly one next link and one incoming link.\n\nReturn the original surviving node object or pointer, not its value or a copied node. You may calculate which node would survive; do not actually change any original values or links. Do not delete input nodes or redeclare the supplied classes.\n\n## Edge cases\n\nA singleton survives for every k. When k is larger than the ring, counting wraps as often as needed. With k=1, removal starts at the head.\n\n### Representation note\n\nExamples show a node table and one head index. The runner builds native links before calling your function. The expected result is the original node index, checked by returned object identity. Table storage order can differ from ring order.",
    constraints: [
      "0 ≤ node count ≤ 2,000; values lie in [-1,000,000,1,000,000].",
      "1 ≤ k ≤ 1,000,000,000.",
      "There is exactly one nullable head; only an empty ring has a null head.",
      "For a nonempty input, next is a non-null permutation of node indexes and all nodes are reachable from the head.",
    ],
    interface:
      "Solution.solve(data,k) receives IdentityList and int, and returns an original ListNode or null.",
    inputSchema: {
      kind: "object",
      properties: {
        data: {
          kind: "object",
          properties: {
            values,
            next: indexes,
            heads: {
              kind: "array",
              minLength: 1,
              maxLength: 1,
              items: { kind: "nullable", value: index },
            },
          },
        },
        k: { kind: "integer", minimum: 1, maximum: 1000000000 },
      },
    },
    outputSchema: { kind: "nullable", value: index },
    semanticConstraints: [
      {
        kind: "node-table",
        field: "data",
        links: ["next"],
        heads: "heads",
        requireReachable: true,
        uniqueLinks: ["next"],
      },
    ],
    function: {
      arguments: [
        { name: "data", type: "IdentityList" },
        { name: "k", type: "int" },
      ],
      returnType: "ListNodeIdentity",
      readOnlyNodes: true,
    },
    languages: refs(
      "class Solution {public ListNode solve(IdentityList data,int k){ListNode node=data.heads[0];if(node==null)return null;int rank=0;for(int size=2;size<=data.nodes.length;size++)rank=(rank+k)%size;for(int i=0;i<rank;i++)node=node.next;return node;}}",
      "class Solution {public:ListNode* solve(IdentityList data,int k){auto node=data.heads[0];if(!node)return nullptr;int rank=0;for(int size=2;size<=(int)data.nodes.size();size++)rank=(rank+k)%size;for(int i=0;i<rank;i++)node=node->next;return node;}};",
      "class Solution:\n    def solve(self, data, k):\n        node=data.heads[0]\n        if node is None:\n            return None\n        rank=0\n        for size in range(2,len(data.nodes)+1):\n            rank=(rank+k)%size\n        for _ in range(rank):\n            node=node.next\n        return node\n",
    ),
  },
  {
    ...preparations[1],
    ...common,
    slug: "weave-original-front-back-nodes",
    skillIds: ["list.split-reverse-weave", "list.reorder-original-identities"],
    prerequisites: ["list.walk", "list.link-splice"],
    checkpointIds: ["linked-list-09", "linked-list-11", "linked-list-12"],
    remedialIds: ["linked-list-01", "linked-list-02"],
    nextIds: [],
    rationale:
      "Split the chain, reverse its second half, and weave both halves without dropping or replacing the middle node.",
    statement:
      "## Weave the front and back\n\nRelink the original nodes into first, last, second, second-last order, continuing inward until every input node appears once. If the length is odd, the middle node appears once at the end.\n\n## Your function\n\n`solve(head)` receives a finite native singly linked list. A ListNode exposes `val` and `next`. Return the new native head after changing links. Do not allocate replacement nodes for the result or change any original node value. Empty input returns null.\n\n## Identity rules\n\nEqual-valued nodes remain distinct. Every original node must appear exactly once in the finite returned chain. Do not delete runner-owned nodes or redeclare the supplied node class.\n\n### Representation note\n\nThe displayed result is the sequence of original input node indexes. The wrapper traverses your returned native chain and checks original identities and values; it rejects copied nodes, repetitions, and cycles. Your function returns a node, not an index array.",
    constraints: [
      "0 ≤ head.length ≤ 2,000.",
      "Values lie in [-1,000,000,1,000,000] and may all be equal.",
      "The input and returned chain must be finite and acyclic.",
      "Every original node appears once in the result, with its original value unchanged.",
    ],
    interface:
      "Solution.solve(head) receives and returns ListNode; the wrapper emits the original-node index sequence.",
    inputSchema: { kind: "object", properties: { head: values } },
    outputSchema: indexes,
    function: {
      arguments: [{ name: "head", type: "ListNode" }],
      returnType: "ListNodeIdentitySequence",
    },
    languages: refs(
      "class Solution {public ListNode solve(ListNode head){if(head==null||head.next==null)return head;ListNode slow=head,fast=head;while(fast.next!=null&&fast.next.next!=null){slow=slow.next;fast=fast.next.next;}ListNode second=slow.next;slow.next=null;ListNode prev=null;while(second!=null){ListNode next=second.next;second.next=prev;prev=second;second=next;}second=prev;ListNode first=head;while(second!=null){ListNode a=first.next,b=second.next;first.next=second;second.next=a;first=a;second=b;}return head;}}",
      "class Solution {public:ListNode* solve(ListNode* head){if(!head||!head->next)return head;auto slow=head;auto fast=head;while(fast->next&&fast->next->next){slow=slow->next;fast=fast->next->next;}auto second=slow->next;slow->next=nullptr;ListNode* prev=nullptr;while(second){auto next=second->next;second->next=prev;prev=second;second=next;}second=prev;auto first=head;while(second){auto a=first->next;auto b=second->next;first->next=second;second->next=a;first=a;second=b;}return head;}};",
      "class Solution:\n    def solve(self, head):\n        if head is None or head.next is None:\n            return head\n        slow=fast=head\n        while fast.next is not None and fast.next.next is not None:\n            slow=slow.next\n            fast=fast.next.next\n        second=slow.next\n        slow.next=None\n        previous=None\n        while second is not None:\n            following=second.next\n            second.next=previous\n            previous=second\n            second=following\n        second=previous\n        first=head\n        while second is not None:\n            a,b=first.next,second.next\n            first.next=second\n            second.next=a\n            first,second=a,b\n        return head\n",
    ),
  },
  {
    ...preparations[2],
    ...common,
    slug: "stable-sort-original-linked-nodes",
    skillIds: ["list.stable-node-merge", "list.divide-chain-sort"],
    prerequisites: ["list.walk", "list.link-splice", "sorted.order"],
    checkpointIds: ["linked-list-09", "linked-list-10", "linked-list-12"],
    remedialIds: ["linked-list-01", "two-pointers-04"],
    nextIds: [],
    rationale:
      "A stable merge must choose the left original node when values are equal; identity-aware tests reveal mistakes invisible in sorted values alone.",
    statement:
      "## Stably sort the list\n\nRelink the original nodes into nondecreasing value order. When two nodes have equal values, preserve their original relative order. Return the new head.\n\n## Your function\n\n`solve(head)` receives a finite native singly linked list. Each ListNode has `val` and `next`. Return a native chain containing every original node once. Change links rather than values; do not substitute newly allocated equal-valued nodes. Empty input returns null.\n\n## Stability and identity\n\nFor input values [3,1,3,1], the sorted original-node order is [1,3,0,2]. The nodes containing 1 retain their order, and so do the nodes containing 3. Do not delete input nodes or redeclare the supplied class. Aim for O(n log n) time.\n\n### Representation note\n\nThe wrapper displays original node indexes, not just sorted values. It checks actual original identities, unchanged values, and a finite chain with no repeated node. Your function returns a native head, not an index array.",
    constraints: [
      "0 ≤ head.length ≤ 2,000.",
      "Signed node values lie in [-1,000,000,1,000,000].",
      "All original nodes must appear exactly once, with their original values unchanged.",
      "Equal-valued nodes preserve original order; target O(n log n) time.",
    ],
    interface:
      "Solution.solve(head) receives and returns ListNode; original-node identity sequence checks stable ordering.",
    inputSchema: { kind: "object", properties: { head: values } },
    outputSchema: indexes,
    function: {
      arguments: [{ name: "head", type: "ListNode" }],
      returnType: "ListNodeIdentitySequence",
    },
    languages: refs(
      "class Solution {private ListNode merge(ListNode a,ListNode b){ListNode dummy=new ListNode(0),tail=dummy;while(a!=null&&b!=null){if(a.val<=b.val){tail.next=a;a=a.next;}else{tail.next=b;b=b.next;}tail=tail.next;}tail.next=a!=null?a:b;return dummy.next;}public ListNode solve(ListNode head){if(head==null||head.next==null)return head;ListNode slow=head,fast=head.next;while(fast!=null&&fast.next!=null){slow=slow.next;fast=fast.next.next;}ListNode right=slow.next;slow.next=null;return merge(solve(head),solve(right));}}",
      "class Solution {ListNode* merge(ListNode* a,ListNode* b){ListNode dummy(0);auto tail=&dummy;while(a&&b){if(a->val<=b->val){tail->next=a;a=a->next;}else{tail->next=b;b=b->next;}tail=tail->next;}tail->next=a?a:b;return dummy.next;}public:ListNode* solve(ListNode* head){if(!head||!head->next)return head;auto slow=head;auto fast=head->next;while(fast&&fast->next){slow=slow->next;fast=fast->next->next;}auto right=slow->next;slow->next=nullptr;return merge(solve(head),solve(right));}};",
      "class Solution:\n    def solve(self, head):\n        if head is None or head.next is None:\n            return head\n        slow,fast=head,head.next\n        while fast is not None and fast.next is not None:\n            slow=slow.next\n            fast=fast.next.next\n        right=slow.next\n        slow.next=None\n        a,b=self.solve(head),self.solve(right)\n        dummy=ListNode(0)\n        tail=dummy\n        while a is not None and b is not None:\n            if a.val<=b.val:\n                tail.next=a\n                a=a.next\n            else:\n                tail.next=b\n                b=b.next\n            tail=tail.next\n        tail.next=a if a is not None else b\n        return dummy.next\n",
    ),
  },
  {
    ...preparations[3],
    ...common,
    slug: "lru-linked-recency-operation-history",
    skillIds: ["list.lru-recency", "list.hash-and-link-coordination"],
    prerequisites: ["hashing.membership", "list.link-splice"],
    checkpointIds: ["linked-list-09", "linked-list-10", "linked-list-11"],
    remedialIds: ["arrays-hashing-03", "linked-list-01"],
    nextIds: [],
    rationale:
      "Hash lookup finds an entry while a doubly linked recency chain updates or evicts it without scanning the cache.",
    statement:
      "## Replay the cache history\n\nProcess commands for a least-recently-used cache with the supplied capacity. A get reads a key and makes a present entry most recently used. A put inserts or updates a key and also makes it most recently used. When inserting beyond capacity, evict the least recently used entry.\n\n## Your function\n\n`solve(capacity, commands, keys, values)` receives an integer and three ordinary typed arrays of equal length. Command i uses keys[i]. A put stores values[i]; a get ignores that value slot. Commands are exactly get or put, so no parsing or unknown-command handling is needed in your solution.\n\nReturn an integer array with one result per command: put returns 0; get returns the stored value or -1 when absent. Values are nonnegative, so -1 means missing. Capacity 0 stores nothing. Updating an existing key must not create a second entry or evict an unrelated entry.\n\n## Complexity target\n\nAim for O(1) expected work per operation with a hash lookup and linked recency order. Each call starts with an empty cache. Return native arrays/lists for your language; do not write a JSON parser.",
    constraints: [
      "0 ≤ capacity ≤ 2,000; 0 ≤ command count ≤ 2,000.",
      "commands, keys, and values have identical lengths.",
      "Commands are exactly get or put.",
      "Keys and stored values lie in [0,1,000,000]; missing get returns -1 and put returns 0.",
      "Both a successful get and any put refresh recency; target O(1) expected work per operation.",
    ],
    interface:
      "Solution.solve(capacity,commands,keys,values) receives int,string[],int[],int[] and returns int[].",
    inputSchema: {
      kind: "object",
      properties: {
        capacity: { kind: "integer", minimum: 0, maximum: 2000 },
        commands: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "enum", values: ["get", "put"] },
        },
        keys: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "integer", minimum: 0, maximum: 1000000 },
        },
        values: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "integer", minimum: 0, maximum: 1000000 },
        },
      },
    },
    outputSchema: {
      kind: "array",
      maxLength: 2000,
      items: { kind: "integer", minimum: -1, maximum: 1000000 },
    },
    semanticConstraints: [
      { kind: "lengths-equal", left: "commands", right: "keys" },
      { kind: "lengths-equal", left: "commands", right: "values" },
    ],
    function: {
      arguments: [
        { name: "capacity", type: "int" },
        { name: "commands", type: "string[]" },
        { name: "keys", type: "int[]" },
        { name: "values", type: "int[]" },
      ],
      returnType: "int[]",
    },
    languages: refs(
      'class Solution {static class Entry {int key,value;Entry prev,next;Entry(int k,int v){key=k;value=v;}}private void unlink(Entry n){n.prev.next=n.next;n.next.prev=n.prev;}private void front(Entry head,Entry n){n.next=head.next;n.prev=head;head.next.prev=n;head.next=n;}public int[] solve(int capacity,String[] commands,int[] keys,int[] values){Entry head=new Entry(0,0),tail=new Entry(0,0);head.next=tail;tail.prev=head;HashMap<Integer,Entry> cache=new HashMap<>();int[] out=new int[commands.length];for(int i=0;i<commands.length;i++){Entry node=cache.get(keys[i]);if(commands[i].equals("get")){if(node==null)out[i]=-1;else{out[i]=node.value;unlink(node);front(head,node);}}else if(capacity>0){if(node!=null){node.value=values[i];unlink(node);front(head,node);}else{node=new Entry(keys[i],values[i]);cache.put(keys[i],node);front(head,node);if(cache.size()>capacity){Entry old=tail.prev;unlink(old);cache.remove(old.key);}}}}return out;}}',
      'class Solution {struct Entry{int key,value;Entry* prev=nullptr;Entry* next=nullptr;Entry(int k,int v):key(k),value(v){}};void unlink(Entry* n){n->prev->next=n->next;n->next->prev=n->prev;}void front(Entry* head,Entry* n){n->next=head->next;n->prev=head;head->next->prev=n;head->next=n;}public:vector<int> solve(int capacity,vector<string> commands,vector<int> keys,vector<int> values){Entry head(0,0),tail(0,0);head.next=&tail;tail.prev=&head;unordered_map<int,Entry*> cache;vector<int> out(commands.size(),0);for(size_t i=0;i<commands.size();i++){auto found=cache.find(keys[i]);auto node=found==cache.end()?nullptr:found->second;if(commands[i]=="get"){if(!node)out[i]=-1;else{out[i]=node->value;unlink(node);front(&head,node);}}else if(capacity>0){if(node){node->value=values[i];unlink(node);front(&head,node);}else{node=new Entry(keys[i],values[i]);cache[keys[i]]=node;front(&head,node);if((int)cache.size()>capacity){auto old=tail.prev;unlink(old);cache.erase(old->key);delete old;}}}}for(auto item:cache)delete item.second;return out;}};',
      'class Solution:\n    def solve(self, capacity, commands, keys, values):\n        class Entry:\n            def __init__(self,key,value):\n                self.key,self.value=key,value\n                self.prev=self.next=None\n        head,tail=Entry(0,0),Entry(0,0)\n        head.next=tail\n        tail.prev=head\n        cache={}\n        def unlink(node):\n            node.prev.next=node.next\n            node.next.prev=node.prev\n        def front(node):\n            node.next=head.next\n            node.prev=head\n            head.next.prev=node\n            head.next=node\n        out=[]\n        for command,key,value in zip(commands,keys,values):\n            node=cache.get(key)\n            if command=="get":\n                if node is None:\n                    out.append(-1)\n                else:\n                    out.append(node.value)\n                    unlink(node)\n                    front(node)\n            else:\n                out.append(0)\n                if capacity==0:\n                    continue\n                if node is not None:\n                    node.value=value\n                    unlink(node)\n                    front(node)\n                else:\n                    node=Entry(key,value)\n                    cache[key]=node\n                    front(node)\n                    if len(cache)>capacity:\n                        old=tail.prev\n                        unlink(old)\n                        del cache[old.key]\n        return out\n',
    ),
  },
];
// Weave identity output depends on length. Preserve prior payloads as integrity
// regressions, but require a separate floor of distinct non-visible lengths.
const weaveDefinition = definitions.find(d => d.id === "linked-list-10");
const originalWeaveCases = weaveDefinition.generate;
weaveDefinition.generate = () => [
  ...originalWeaveCases(),
  ...Array.from({ length: 200 }, (_, index) => {
    const length = index + 30;
    return {
      input: { head: Array.from({ length }, (_, at) => (at % 3 - 1) * 1000000) },
      category: "weave-distinct-length-structural-certificate",
    };
  }),
];
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "LL09–12 authored drafts; trusted JS independent oracle/mutation checks only",
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
        report.failures.push(d.id + ": mismatch");
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(d.id + ": mutation " + m.name);
    report.packs.push({
      id: d.id,
      hidden: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-LL-advanced-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("linked-list-advanced.mjs")) {
  for (const d of definitions) console.log(await materializePack(d));
  audit();
}
