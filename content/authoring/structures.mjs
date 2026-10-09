// Reviewed typed input helpers. No expected answers or acceptance logic enter the program.
export const pythonStructures = `
class ListNode:
    def __init__(self, val=0, next=None, random=None):
        self.val,self.next,self.random=val,next,random
class TreeNode:
    def __init__(self,val=0,left=None,right=None):
        self.val,self.left,self.right=val,left,right
class GraphNode:
    def __init__(self,val=0,neighbors=None):
        self.val,self.neighbors=val,list(neighbors or [])
class MultiListNode:
    def __init__(self,val=0,next=None,prev=None,child=None):self.val,self.next,self.prev,self.child=val,next,prev,child
class IdentityList:
    def __init__(self,nodes,heads):self.nodes,self.heads=nodes,heads
class IdentityTree:
    def __init__(self,root,targets):self.root,self.targets=root,targets
class CwContext:
    def __init__(self):
        self._list_ids={};self._tree_ids={};self._graph_original=set();self._owned=[]
        self._multi_ids={}
        self._readonly_snapshot=None
    def snapshot_inputs(self):
        self._readonly_snapshot=[]
        for node in self._owned:
            if isinstance(node,ListNode):state=('list',node,node.val,node.next,node.random)
            elif isinstance(node,MultiListNode):state=('multi',node,node.val,node.next,node.prev,node.child)
            elif isinstance(node,TreeNode):state=('tree',node,node.val,node.left,node.right)
            elif isinstance(node,GraphNode):state=('graph',node,node.val,tuple(node.neighbors))
            else:raise ValueError('Unknown original node type')
            self._readonly_snapshot.append(state)
    def check_input_values(self):
        if self._readonly_snapshot is None:raise ValueError('Missing original node snapshot')
        for state in self._readonly_snapshot:
            if state[1].val!=state[2]:raise ValueError('Original node value changed')
    def check_inputs(self):
        if self._readonly_snapshot is None:raise ValueError('Missing original node snapshot')
        for state in self._readonly_snapshot:
            kind,node,value=state[:3]
            if node.val!=value:raise ValueError('Read-only original node value changed')
            if kind=='list' and (node.next is not state[3] or node.random is not state[4]):raise ValueError('Read-only original list links changed')
            if kind=='multi' and (node.next is not state[3] or node.prev is not state[4] or node.child is not state[5]):raise ValueError('Read-only original multilevel links changed')
            if kind=='tree' and (node.left is not state[3] or node.right is not state[4]):raise ValueError('Read-only original tree links changed')
            if kind=='graph' and (len(node.neighbors)!=len(state[3]) or any(a is not b for a,b in zip(node.neighbors,state[3]))):raise ValueError('Read-only original graph neighbors changed')
    def list(self,values):
        nodes=[ListNode(v) for v in values]
        self._owned.extend(nodes)
        for i,node in enumerate(nodes):
            self._list_ids[id(node)]=i
            if i+1<len(nodes):node.next=nodes[i+1]
        return nodes[0] if nodes else None
    def identity_list(self,data):
        nodes=[ListNode(v) for v in data['values']]
        self._owned.extend(nodes)
        for i,node in enumerate(nodes):
            self._list_ids[id(node)]=i
            node.next=None if data['next'][i] is None else nodes[data['next'][i]]
            if 'random' in data:node.random=None if data['random'][i] is None else nodes[data['random'][i]]
        return IdentityList(nodes,[None if i is None else nodes[i] for i in data['heads']])
    def multi_list(self,data):
        nodes=[MultiListNode(v) for v in data['values']];self._owned.extend(nodes)
        for i,node in enumerate(nodes):
            self._multi_ids[id(node)]=i
            node.next=None if data['next'][i] is None else nodes[data['next'][i]]
            node.child=None if data['child'][i] is None else nodes[data['child'][i]]
            if node.next is not None:node.next.prev=node
        return None if data['head'] is None else nodes[data['head']]
    def multi_identity_sequence(self,node):
        out=[];seen=set();previous=None
        while node is not None:
            if id(node) not in self._multi_ids or id(node) in seen or len(out)>=100000 or node.child is not None or node.prev is not previous:raise ValueError('Invalid flattened original multilevel chain')
            seen.add(id(node));out.append(self._multi_ids[id(node)]);previous,node=node,node.next
        return out
    def tree(self,values):
        if not values or values[0] is None:return None
        root=TreeNode(values[0]);self._owned.append(root);self._tree_ids[id(root)]=0;queue=[root];cursor=1
        for node in queue:
            for side in ('left','right'):
                if cursor>=len(values):break
                value=values[cursor]
                if value is not None:
                    child=TreeNode(value);self._owned.append(child);self._tree_ids[id(child)]=cursor
                    setattr(node,side,child);queue.append(child)
                cursor+=1
        return root
    def identity_tree(self,data):
        root=self.tree(data['values']);queue=[] if root is None else [root];by_slot={}
        for node in queue:
            by_slot[self._tree_ids[id(node)]]=node
            if node.left is not None:queue.append(node.left)
            if node.right is not None:queue.append(node.right)
        return IdentityTree(root,[by_slot[i] for i in data['targetIndices']])
    def graph(self,data):
        nodes=[GraphNode(v) for v in data['values']]
        self._owned.extend(nodes)
        self._graph_original.update(id(n) for n in nodes)
        for i,node in enumerate(nodes):node.neighbors=[nodes[j] for j in data['neighbors'][i]]
        return None if data['root'] is None else nodes[data['root']]
    def list_identity_parts(self,heads):
        out=[];seen=set()
        if not isinstance(heads,list) or len(heads)>100000:raise ValueError('Invalid parts result')
        for head in heads:
            part=self.list_identity_sequence(head)
            for identity in part:
                if identity in seen:raise ValueError('Original node appears in multiple parts')
                seen.add(identity)
            out.append(part)
        return out
    def list_identity_sequence(self,node):
        out=[];seen=set()
        while node is not None:
            identity=id(node)
            if identity not in self._list_ids or identity in seen or len(out)>=100000:raise ValueError('Invalid original-node sequence')
            seen.add(identity);out.append(self._list_ids[identity]);node=node.next
        return out
    def list_identity(self,node):
        if node is None:return None
        if id(node) not in self._list_ids:raise ValueError('Result is not an original list node')
        return self._list_ids[id(node)]
    def tree_identity(self,node):
        if node is None:return None
        if id(node) not in self._tree_ids:raise ValueError('Result is not an original tree node')
        return self._tree_ids[id(node)]
    def list_values(self,node):
        out=[];seen=set()
        while node is not None:
            if id(node) in seen or len(out)>=100000:raise ValueError('Invalid result list')
            seen.add(id(node));out.append(node.val);node=node.next
        return out
    def tree_values(self,root):
        if root is None:return []
        queue=[root];out=[];seen=set()
        for node in queue:
            if len(queue)>200001:raise ValueError('Tree too large')
            if node is None:out.append(None);continue
            if id(node) in seen:raise ValueError('Result is not a tree')
            seen.add(id(node));out.append(node.val);queue.extend([node.left,node.right])
        while out and out[-1] is None:out.pop()
        return out
    def clone_list(self,head):
        nodes=[];indices={};queue=[]
        if head is not None:indices[id(head)]=0;queue.append(head)
        for node in queue:
            if len(queue)>100000:raise ValueError('Clone too large')
            for child in (node.next,node.random):
                if child is not None and id(child) not in indices:
                    indices[id(child)]=len(queue);queue.append(child)
        return {'values':[n.val for n in queue],'next':[None if n.next is None else indices[id(n.next)] for n in queue],'random':[None if n.random is None else indices[id(n.random)] for n in queue],'head':0 if head is not None else None,'aliasesOriginal':any(id(n) in self._list_ids for n in queue)}
    def clone_graph(self,root):
        queue=[];indices={}
        if root is not None:indices[id(root)]=0;queue.append(root)
        for node in queue:
            if len(queue)>100000:raise ValueError('Clone too large')
            for child in node.neighbors:
                if child is None:raise ValueError('Null graph neighbor')
                if id(child) not in indices:indices[id(child)]=len(queue);queue.append(child)
        return {'values':[n.val for n in queue],'neighbors':[[indices[id(v)] for v in n.neighbors] for n in queue],'root':0 if root is not None else None,'aliasesOriginal':any(id(n) in self._graph_original for n in queue)}
`;
export const cppStructures = `
struct ListNode {int val;ListNode* next;ListNode* random;explicit ListNode(int v=0,ListNode* n=nullptr,ListNode* r=nullptr):val(v),next(n),random(r){}};
struct TreeNode {int val;TreeNode* left;TreeNode* right;explicit TreeNode(int v=0,TreeNode* l=nullptr,TreeNode* r=nullptr):val(v),left(l),right(r){}};
struct GraphNode {int val;vector<GraphNode*> neighbors;explicit GraphNode(int v=0,vector<GraphNode*> n={}):val(v),neighbors(std::move(n)){}};
struct MultiListNode {int val;MultiListNode *next=nullptr,*prev=nullptr,*child=nullptr;explicit MultiListNode(int v=0):val(v){}};
struct IdentityList {vector<ListNode*> nodes;vector<ListNode*> heads;};
struct IdentityTree {TreeNode* root=nullptr;vector<TreeNode*> targets;};
class CwContext {
 vector<unique_ptr<MultiListNode>> ownedMultis;unordered_map<MultiListNode*,int> multiIds;vector<tuple<MultiListNode*,int,MultiListNode*,MultiListNode*,MultiListNode*>> multiSnapshot;
 vector<unique_ptr<ListNode>> ownedLists;vector<unique_ptr<TreeNode>> ownedTrees;vector<unique_ptr<GraphNode>> ownedGraphs;
 unordered_map<ListNode*,int> listIds;unordered_map<TreeNode*,int> treeIds;unordered_set<GraphNode*> graphOriginal;
 vector<tuple<ListNode*,int,ListNode*,ListNode*>> listSnapshot;
 vector<tuple<TreeNode*,int,TreeNode*,TreeNode*>> treeSnapshot;
 vector<tuple<GraphNode*,int,vector<GraphNode*>>> graphSnapshot;
 bool snapshotReady=false;
 ListNode* makeList(int value,int id){ownedLists.push_back(make_unique<ListNode>(value));auto n=ownedLists.back().get();listIds[n]=id;return n;}
 TreeNode* makeTree(int value,int id){ownedTrees.push_back(make_unique<TreeNode>(value));auto n=ownedTrees.back().get();treeIds[n]=id;return n;}
 MultiListNode* makeMulti(int value,int id){ownedMultis.push_back(make_unique<MultiListNode>(value));auto n=ownedMultis.back().get();multiIds[n]=id;return n;}
 public:
 void snapshot_inputs(){listSnapshot.clear();treeSnapshot.clear();graphSnapshot.clear();for(const auto& n:ownedLists)listSnapshot.emplace_back(n.get(),n->val,n->next,n->random);for(const auto& n:ownedTrees)treeSnapshot.emplace_back(n.get(),n->val,n->left,n->right);for(const auto& n:ownedGraphs)graphSnapshot.emplace_back(n.get(),n->val,n->neighbors);multiSnapshot.clear();for(const auto& n:ownedMultis)multiSnapshot.emplace_back(n.get(),n->val,n->next,n->prev,n->child);snapshotReady=true;}
 void check_inputs(){for(const auto& s:multiSnapshot){auto n=get<0>(s);if(n->val!=get<1>(s)||n->next!=get<2>(s)||n->prev!=get<3>(s)||n->child!=get<4>(s))throw runtime_error("Read-only original multilevel node changed");}if(!snapshotReady)throw runtime_error("Missing original node snapshot");for(const auto& s:listSnapshot){auto n=get<0>(s);if(n->val!=get<1>(s)||n->next!=get<2>(s)||n->random!=get<3>(s))throw runtime_error("Read-only original list changed");}for(const auto& s:treeSnapshot){auto n=get<0>(s);if(n->val!=get<1>(s)||n->left!=get<2>(s)||n->right!=get<3>(s))throw runtime_error("Read-only original tree changed");}for(const auto& s:graphSnapshot){auto n=get<0>(s);if(n->val!=get<1>(s)||n->neighbors!=get<2>(s))throw runtime_error("Read-only original graph changed");}}
 ListNode* list(const json& input){ListNode* head=nullptr;ListNode* tail=nullptr;for(int i=0;i<(int)input.size();i++){auto n=makeList(input[i].get<int>(),i);if(tail)tail->next=n;else head=n;tail=n;}return head;}
 IdentityList identity_list(const json& data){IdentityList result;auto values=data.at("values");for(int i=0;i<(int)values.size();i++)result.nodes.push_back(makeList(values[i].get<int>(),i));for(int i=0;i<(int)values.size();i++){auto ix=data.at("next")[i];if(!ix.is_null())result.nodes[i]->next=result.nodes.at(ix.get<int>());if(data.contains("random")){ix=data.at("random")[i];if(!ix.is_null())result.nodes[i]->random=result.nodes.at(ix.get<int>());}}for(auto ix:data.at("heads"))result.heads.push_back(ix.is_null()?nullptr:result.nodes.at(ix.get<int>()));return result;}
 MultiListNode* multi_list(const json& data){vector<MultiListNode*> nodes;for(size_t i=0;i<data.at("values").size();i++)nodes.push_back(makeMulti(data.at("values")[i].get<int>(),i));for(size_t i=0;i<nodes.size();i++){auto next=data.at("next")[i],child=data.at("child")[i];if(!next.is_null()){nodes[i]->next=nodes.at(next.get<int>());nodes[i]->next->prev=nodes[i];}if(!child.is_null())nodes[i]->child=nodes.at(child.get<int>());}return data.at("head").is_null()?nullptr:nodes.at(data.at("head").get<int>());}
 vector<int> multi_identity_sequence(MultiListNode* node){vector<int> out;unordered_set<MultiListNode*> seen;MultiListNode* previous=nullptr;while(node){if(!multiIds.count(node)||!seen.insert(node).second||out.size()>=100000||node->child||node->prev!=previous)throw runtime_error("Invalid flattened original multilevel chain");out.push_back(multiIds.at(node));previous=node;node=node->next;}return out;}
 TreeNode* tree(const json& values){if(values.empty()||values[0].is_null())return nullptr;auto root=makeTree(values[0].get<int>(),0);vector<TreeNode*> queue={root};size_t cursor=1;for(size_t q=0;q<queue.size()&&cursor<values.size();q++){for(auto side:{&queue[q]->left,&queue[q]->right}){if(cursor>=values.size())break;if(!values[cursor].is_null()){*side=makeTree(values[cursor].get<int>(),cursor);queue.push_back(*side);}cursor++;}}return root;}
 IdentityTree identity_tree(const json& data){IdentityTree result;result.root=tree(data.at("values"));vector<TreeNode*> queue;if(result.root)queue.push_back(result.root);unordered_map<int,TreeNode*> bySlot;for(size_t i=0;i<queue.size();i++){auto node=queue[i];bySlot[treeIds.at(node)]=node;if(node->left)queue.push_back(node->left);if(node->right)queue.push_back(node->right);}for(auto index:data.at("targetIndices"))result.targets.push_back(bySlot.at(index.get<int>()));return result;}
 GraphNode* graph(const json& data){vector<GraphNode*> nodes;for(auto value:data.at("values")){ownedGraphs.push_back(make_unique<GraphNode>(value.get<int>()));nodes.push_back(ownedGraphs.back().get());graphOriginal.insert(nodes.back());}for(int i=0;i<(int)nodes.size();i++)for(auto ix:data.at("neighbors")[i])nodes[i]->neighbors.push_back(nodes.at(ix.get<int>()));return data.at("root").is_null()?nullptr:nodes.at(data.at("root").get<int>());}
 void check_input_values(){for(const auto& s:multiSnapshot)if(get<0>(s)->val!=get<1>(s))throw runtime_error("Original multilevel value changed");if(!snapshotReady)throw runtime_error("Missing original node snapshot");for(const auto& s:listSnapshot)if(get<0>(s)->val!=get<1>(s))throw runtime_error("Original node value changed");for(const auto& s:treeSnapshot)if(get<0>(s)->val!=get<1>(s))throw runtime_error("Original node value changed");for(const auto& s:graphSnapshot)if(get<0>(s)->val!=get<1>(s))throw runtime_error("Original node value changed");}
 vector<vector<int>> list_identity_parts(vector<ListNode*> heads){if(heads.size()>100000)throw runtime_error("Invalid parts result");vector<vector<int>> out;unordered_set<int> seen;for(auto head:heads){auto part=list_identity_sequence(head);for(int id:part)if(!seen.insert(id).second)throw runtime_error("Original node appears in multiple parts");out.push_back(part);}return out;}
 vector<int> list_identity_sequence(ListNode* n){vector<int> out;unordered_set<ListNode*> seen;while(n){if(!listIds.count(n)||!seen.insert(n).second||out.size()>=100000)throw runtime_error("Invalid original-node sequence");out.push_back(listIds.at(n));n=n->next;}return out;}
 json list_identity(ListNode* n){if(!n)return nullptr;if(!listIds.count(n))throw runtime_error("Foreign list node");return listIds.at(n);}
 json tree_identity(TreeNode* n){if(!n)return nullptr;if(!treeIds.count(n))throw runtime_error("Foreign tree node");return treeIds.at(n);}
 vector<int> list_values(ListNode* n){vector<int> out;unordered_set<ListNode*> seen;while(n){if(!seen.insert(n).second||out.size()>=100000)throw runtime_error("Invalid result list");out.push_back(n->val);n=n->next;}return out;}
 json tree_values(TreeNode* root){json out=json::array();if(!root)return out;vector<TreeNode*> queue={root};unordered_set<TreeNode*> seen;for(size_t i=0;i<queue.size();i++){if(queue.size()>200001)throw runtime_error("Tree too large");auto n=queue[i];if(!n){out.push_back(nullptr);continue;}if(!seen.insert(n).second)throw runtime_error("Not a tree");out.push_back(n->val);queue.push_back(n->left);queue.push_back(n->right);}while(!out.empty()&&out.back().is_null())out.erase(out.end()-1);return out;}
 json clone_list(ListNode* head){vector<ListNode*> queue;unordered_map<ListNode*,int> indices;if(head){queue.push_back(head);indices[head]=0;}for(size_t i=0;i<queue.size();i++){if(queue.size()>100000)throw runtime_error("Clone too large");for(auto child:{queue[i]->next,queue[i]->random})if(child&&!indices.count(child)){indices[child]=queue.size();queue.push_back(child);}}json values=json::array(),next=json::array(),random=json::array();bool aliases=false;for(auto n:queue){values.push_back(n->val);next.push_back(n->next?json(indices.at(n->next)):json(nullptr));random.push_back(n->random?json(indices.at(n->random)):json(nullptr));aliases|=listIds.count(n)!=0;}return json{{"values",values},{"next",next},{"random",random},{"head",head?json(0):json(nullptr)},{"aliasesOriginal",aliases}};}
 json clone_graph(GraphNode* root){vector<GraphNode*> queue;unordered_map<GraphNode*,int> indices;if(root){queue.push_back(root);indices[root]=0;}for(size_t i=0;i<queue.size();i++){if(queue.size()>100000)throw runtime_error("Clone too large");for(auto child:queue[i]->neighbors){if(!child)throw runtime_error("Null neighbor");if(!indices.count(child)){indices[child]=queue.size();queue.push_back(child);}}}json values=json::array(),neighbors=json::array();bool aliases=false;for(auto n:queue){values.push_back(n->val);json links=json::array();for(auto child:n->neighbors)links.push_back(indices.at(child));neighbors.push_back(links);aliases|=graphOriginal.count(n)!=0;}return json{{"values",values},{"neighbors",neighbors},{"root",root?json(0):json(nullptr)},{"aliasesOriginal",aliases}};}
 void list_cleanup(ListNode* head){vector<ListNode*> q;unordered_set<ListNode*> seen;if(head){q.push_back(head);seen.insert(head);}for(size_t i=0;i<q.size();i++){if(q.size()>100000)throw runtime_error("Result too large");for(auto n:{q[i]->next,q[i]->random})if(n&&seen.insert(n).second)q.push_back(n);}for(auto n:q)if(!listIds.count(n))delete n;}
 void tree_cleanup(TreeNode* root){vector<TreeNode*> q;unordered_set<TreeNode*> seen;if(root){q.push_back(root);seen.insert(root);}for(size_t i=0;i<q.size();i++){if(q.size()>100000)throw runtime_error("Result too large");for(auto n:{q[i]->left,q[i]->right})if(n&&seen.insert(n).second)q.push_back(n);}for(auto n:q)if(!treeIds.count(n))delete n;}
 void graph_cleanup(GraphNode* root){vector<GraphNode*> q;unordered_set<GraphNode*> seen;if(root){q.push_back(root);seen.insert(root);}for(size_t i=0;i<q.size();i++){if(q.size()>100000)throw runtime_error("Result too large");for(auto n:q[i]->neighbors)if(n&&seen.insert(n).second)q.push_back(n);}for(auto n:q)if(!graphOriginal.count(n))delete n;}
};
`;
export const javaStructures = `
class ListNode {int val;ListNode next,random;ListNode(int v){val=v;}ListNode(int v,ListNode n){val=v;next=n;}ListNode(int v,ListNode n,ListNode r){val=v;next=n;random=r;}}
class TreeNode {int val;TreeNode left,right;TreeNode(int v){val=v;}TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
class GraphNode {int val;ArrayList<GraphNode> neighbors=new ArrayList<>();GraphNode(int v){val=v;}GraphNode(int v,List<GraphNode> n){val=v;neighbors.addAll(n);}}
class MultiListNode {int val;MultiListNode next,prev,child;MultiListNode(int value){val=value;}}
class IdentityList {ListNode[] nodes,heads;IdentityList(ListNode[] n,ListNode[] h){nodes=n;heads=h;}}
class IdentityTree {TreeNode root;TreeNode[] targets;IdentityTree(TreeNode r,TreeNode[] t){root=r;targets=t;}}
class CwContext {
 private IdentityHashMap<MultiListNode,Integer> multiIds=new IdentityHashMap<>();
 private static class MultiSnapshot {MultiListNode node,next,prev,child;int value;MultiSnapshot(MultiListNode n){node=n;value=n.val;next=n.next;prev=n.prev;child=n.child;}}
 private ArrayList<MultiSnapshot> multiSnapshot;
 private IdentityHashMap<ListNode,Integer> listIds=new IdentityHashMap<>();private IdentityHashMap<TreeNode,Integer> treeIds=new IdentityHashMap<>();private Set<GraphNode> graphOriginal=Collections.newSetFromMap(new IdentityHashMap<>());
 private static class ListSnapshot {ListNode node,next,random;int value;ListSnapshot(ListNode n){node=n;value=n.val;next=n.next;random=n.random;}}
 private static class TreeSnapshot {TreeNode node,left,right;int value;TreeSnapshot(TreeNode n){node=n;value=n.val;left=n.left;right=n.right;}}
 private static class GraphSnapshot {GraphNode node;int value;ArrayList<GraphNode> neighbors;GraphSnapshot(GraphNode n){node=n;value=n.val;neighbors=new ArrayList<>(n.neighbors);}}
 private ArrayList<ListSnapshot> listSnapshot;private ArrayList<TreeSnapshot> treeSnapshot;private ArrayList<GraphSnapshot> graphSnapshot;
 void snapshot_inputs(){multiSnapshot=new ArrayList<>();for(MultiListNode n:multiIds.keySet())multiSnapshot.add(new MultiSnapshot(n));listSnapshot=new ArrayList<>();treeSnapshot=new ArrayList<>();graphSnapshot=new ArrayList<>();for(ListNode n:listIds.keySet())listSnapshot.add(new ListSnapshot(n));for(TreeNode n:treeIds.keySet())treeSnapshot.add(new TreeSnapshot(n));for(GraphNode n:graphOriginal)graphSnapshot.add(new GraphSnapshot(n));}
 void check_inputs(){if(multiSnapshot==null)throw new IllegalArgumentException("Missing original multilevel snapshot");for(MultiSnapshot s:multiSnapshot)if(s.node.val!=s.value||s.node.next!=s.next||s.node.prev!=s.prev||s.node.child!=s.child)throw new IllegalArgumentException("Read-only original multilevel node changed");if(listSnapshot==null)throw new IllegalArgumentException("Missing original node snapshot");for(ListSnapshot s:listSnapshot)if(s.node.val!=s.value||s.node.next!=s.next||s.node.random!=s.random)throw new IllegalArgumentException("Read-only original list changed");for(TreeSnapshot s:treeSnapshot)if(s.node.val!=s.value||s.node.left!=s.left||s.node.right!=s.right)throw new IllegalArgumentException("Read-only original tree changed");for(GraphSnapshot s:graphSnapshot){if(s.node.val!=s.value||s.node.neighbors.size()!=s.neighbors.size())throw new IllegalArgumentException("Read-only original graph changed");for(int i=0;i<s.neighbors.size();i++)if(s.node.neighbors.get(i)!=s.neighbors.get(i))throw new IllegalArgumentException("Read-only original graph neighbors changed");}}
 ListNode list(JsonElement data){JsonArray a=data.getAsJsonArray();ListNode head=null,tail=null;for(int i=0;i<a.size();i++){ListNode node=new ListNode(a.get(i).getAsInt());listIds.put(node,i);if(tail==null)head=node;else tail.next=node;tail=node;}return head;}
 IdentityList identity_list(JsonElement element){JsonObject data=element.getAsJsonObject();JsonArray a=data.getAsJsonArray("values"),next=data.getAsJsonArray("next"),random=data.has("random")?data.getAsJsonArray("random"):null,heads=data.getAsJsonArray("heads");ListNode[] nodes=new ListNode[a.size()];for(int i=0;i<a.size();i++){nodes[i]=new ListNode(a.get(i).getAsInt());listIds.put(nodes[i],i);}for(int i=0;i<a.size();i++){if(!next.get(i).isJsonNull())nodes[i].next=nodes[next.get(i).getAsInt()];if(random!=null&&!random.get(i).isJsonNull())nodes[i].random=nodes[random.get(i).getAsInt()];}ListNode[] hs=new ListNode[heads.size()];for(int i=0;i<hs.length;i++)if(!heads.get(i).isJsonNull())hs[i]=nodes[heads.get(i).getAsInt()];return new IdentityList(nodes,hs);}
 MultiListNode multi_list(JsonElement element){JsonObject data=element.getAsJsonObject();JsonArray values=data.getAsJsonArray("values"),next=data.getAsJsonArray("next"),child=data.getAsJsonArray("child");MultiListNode[] nodes=new MultiListNode[values.size()];for(int i=0;i<nodes.length;i++){nodes[i]=new MultiListNode(values.get(i).getAsInt());multiIds.put(nodes[i],i);}for(int i=0;i<nodes.length;i++){if(!next.get(i).isJsonNull()){nodes[i].next=nodes[next.get(i).getAsInt()];nodes[i].next.prev=nodes[i];}if(!child.get(i).isJsonNull())nodes[i].child=nodes[child.get(i).getAsInt()];}return data.get("head").isJsonNull()?null:nodes[data.get("head").getAsInt()];}
 int[] multi_identity_sequence(MultiListNode node){ArrayList<Integer> out=new ArrayList<>();Set<MultiListNode> seen=Collections.newSetFromMap(new IdentityHashMap<>());MultiListNode previous=null;while(node!=null){if(!multiIds.containsKey(node)||!seen.add(node)||out.size()>=100000||node.child!=null||node.prev!=previous)throw new IllegalArgumentException("Invalid flattened original multilevel chain");out.add(multiIds.get(node));previous=node;node=node.next;}return out.stream().mapToInt(Integer::intValue).toArray();}
 TreeNode tree(JsonElement element){JsonArray a=element.getAsJsonArray();if(a.size()==0||a.get(0).isJsonNull())return null;TreeNode root=new TreeNode(a.get(0).getAsInt());treeIds.put(root,0);ArrayList<TreeNode> q=new ArrayList<>();q.add(root);int c=1;for(int i=0;i<q.size()&&c<a.size();i++){TreeNode n=q.get(i);if(!a.get(c).isJsonNull()){n.left=new TreeNode(a.get(c).getAsInt());treeIds.put(n.left,c);q.add(n.left);}c++;if(c<a.size()){if(!a.get(c).isJsonNull()){n.right=new TreeNode(a.get(c).getAsInt());treeIds.put(n.right,c);q.add(n.right);}c++;}}return root;}
 IdentityTree identity_tree(JsonElement element){JsonObject data=element.getAsJsonObject();TreeNode root=tree(data.get("values"));ArrayList<TreeNode> queue=new ArrayList<>();if(root!=null)queue.add(root);Map<Integer,TreeNode> bySlot=new HashMap<>();for(int i=0;i<queue.size();i++){TreeNode node=queue.get(i);bySlot.put(treeIds.get(node),node);if(node.left!=null)queue.add(node.left);if(node.right!=null)queue.add(node.right);}JsonArray indices=data.getAsJsonArray("targetIndices");TreeNode[] targets=new TreeNode[indices.size()];for(int i=0;i<targets.length;i++){targets[i]=bySlot.get(indices.get(i).getAsInt());if(targets[i]==null)throw new IllegalArgumentException("Invalid original tree target");}return new IdentityTree(root,targets);}
 GraphNode graph(JsonElement element){JsonObject data=element.getAsJsonObject();JsonArray values=data.getAsJsonArray("values"),neighbors=data.getAsJsonArray("neighbors");GraphNode[] nodes=new GraphNode[values.size()];for(int i=0;i<nodes.length;i++){nodes[i]=new GraphNode(values.get(i).getAsInt());graphOriginal.add(nodes[i]);}for(int i=0;i<nodes.length;i++)for(JsonElement ix:neighbors.get(i).getAsJsonArray())nodes[i].neighbors.add(nodes[ix.getAsInt()]);return data.get("root").isJsonNull()?null:nodes[data.get("root").getAsInt()];}
 void check_input_values(){if(multiSnapshot==null)throw new IllegalArgumentException("Missing original multilevel snapshot");for(MultiSnapshot s:multiSnapshot)if(s.node.val!=s.value)throw new IllegalArgumentException("Original multilevel value changed");if(listSnapshot==null)throw new IllegalArgumentException("Missing original node snapshot");for(ListSnapshot s:listSnapshot)if(s.node.val!=s.value)throw new IllegalArgumentException("Original node value changed");for(TreeSnapshot s:treeSnapshot)if(s.node.val!=s.value)throw new IllegalArgumentException("Original node value changed");for(GraphSnapshot s:graphSnapshot)if(s.node.val!=s.value)throw new IllegalArgumentException("Original node value changed");}
 int[][] list_identity_parts(ListNode[] heads){if(heads==null||heads.length>100000)throw new IllegalArgumentException("Invalid parts result");int[][] out=new int[heads.length][];HashSet<Integer> seen=new HashSet<>();for(int i=0;i<heads.length;i++){out[i]=list_identity_sequence(heads[i]);for(int id:out[i])if(!seen.add(id))throw new IllegalArgumentException("Original node appears in multiple parts");}return out;}
 int[] list_identity_sequence(ListNode n){ArrayList<Integer> out=new ArrayList<>();Set<ListNode> seen=Collections.newSetFromMap(new IdentityHashMap<>());while(n!=null){if(!listIds.containsKey(n)||!seen.add(n)||out.size()>=100000)throw new IllegalArgumentException("Invalid original-node sequence");out.add(listIds.get(n));n=n.next;}return out.stream().mapToInt(Integer::intValue).toArray();}
 Integer list_identity(ListNode n){if(n==null)return null;if(!listIds.containsKey(n))throw new IllegalArgumentException("Foreign list node");return listIds.get(n);}
 Integer tree_identity(TreeNode n){if(n==null)return null;if(!treeIds.containsKey(n))throw new IllegalArgumentException("Foreign tree node");return treeIds.get(n);}
 int[] list_values(ListNode n){ArrayList<Integer> out=new ArrayList<>();Set<ListNode> seen=Collections.newSetFromMap(new IdentityHashMap<>());while(n!=null){if(!seen.add(n)||out.size()>=100000)throw new IllegalArgumentException("Invalid list");out.add(n.val);n=n.next;}int[] a=new int[out.size()];for(int i=0;i<a.length;i++)a[i]=out.get(i);return a;}
 JsonArray tree_values(TreeNode root){JsonArray out=new JsonArray();if(root==null)return out;ArrayList<TreeNode> q=new ArrayList<>();Set<TreeNode> seen=Collections.newSetFromMap(new IdentityHashMap<>());q.add(root);for(int i=0;i<q.size();i++){if(q.size()>200001)throw new IllegalArgumentException("Tree too large");TreeNode n=q.get(i);if(n==null){out.add(JsonNull.INSTANCE);continue;}if(!seen.add(n))throw new IllegalArgumentException("Not a tree");out.add(n.val);q.add(n.left);q.add(n.right);}while(out.size()>0&&out.get(out.size()-1).isJsonNull())out.remove(out.size()-1);return out;}
 JsonObject clone_list(ListNode head){ArrayList<ListNode> q=new ArrayList<>();IdentityHashMap<ListNode,Integer> ids=new IdentityHashMap<>();if(head!=null){q.add(head);ids.put(head,0);}for(int i=0;i<q.size();i++){if(q.size()>100000)throw new IllegalArgumentException("Clone too large");for(ListNode child:new ListNode[]{q.get(i).next,q.get(i).random})if(child!=null&&!ids.containsKey(child)){ids.put(child,q.size());q.add(child);}}JsonArray values=new JsonArray(),next=new JsonArray(),random=new JsonArray();boolean aliases=false;for(ListNode n:q){values.add(n.val);next.add(n.next==null?JsonNull.INSTANCE:new JsonPrimitive(ids.get(n.next)));random.add(n.random==null?JsonNull.INSTANCE:new JsonPrimitive(ids.get(n.random)));aliases|=listIds.containsKey(n);}JsonObject out=new JsonObject();out.add("values",values);out.add("next",next);out.add("random",random);out.add("head",head==null?JsonNull.INSTANCE:new JsonPrimitive(0));out.addProperty("aliasesOriginal",aliases);return out;}
 JsonObject clone_graph(GraphNode root){ArrayList<GraphNode> q=new ArrayList<>();IdentityHashMap<GraphNode,Integer> ids=new IdentityHashMap<>();if(root!=null){q.add(root);ids.put(root,0);}for(int i=0;i<q.size();i++){if(q.size()>100000)throw new IllegalArgumentException("Clone too large");for(GraphNode child:q.get(i).neighbors){if(child==null)throw new IllegalArgumentException("Null neighbor");if(!ids.containsKey(child)){ids.put(child,q.size());q.add(child);}}}JsonArray values=new JsonArray(),neighbors=new JsonArray();boolean aliases=false;for(GraphNode n:q){values.add(n.val);JsonArray links=new JsonArray();for(GraphNode child:n.neighbors)links.add(ids.get(child));neighbors.add(links);aliases|=graphOriginal.contains(n);}JsonObject out=new JsonObject();out.add("values",values);out.add("neighbors",neighbors);out.add("root",root==null?JsonNull.INSTANCE:new JsonPrimitive(0));out.addProperty("aliasesOriginal",aliases);return out;}
}
`;
