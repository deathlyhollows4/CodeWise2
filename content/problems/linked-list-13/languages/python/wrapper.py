import json,sys

class ListNode:
    def __init__(self, val=0, next=None, random=None):
        self.val,self.next,self.random=val,next,random
class TreeNode:
    def __init__(self,val=0,left=None,right=None):
        self.val,self.left,self.right=val,left,right
class GraphNode:
    def __init__(self,val=0,neighbors=None):
        self.val,self.neighbors=val,list(neighbors or [])
class IdentityList:
    def __init__(self,nodes,heads):self.nodes,self.heads=nodes,heads
class CwContext:
    def __init__(self):
        self._list_ids={};self._tree_ids={};self._graph_original=set();self._owned=[]
        self._readonly_snapshot=None
    def snapshot_inputs(self):
        self._readonly_snapshot=[]
        for node in self._owned:
            if isinstance(node,ListNode):state=('list',node,node.val,node.next,node.random)
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

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    cw=CwContext()
    cwArgument0=cw.list(input["head"])
    cwArgument1=input["pivot"]
    cw.snapshot_inputs()
    result=Solution().solve(cwArgument0,cwArgument1)
    cw.check_input_values()
    print(json.dumps(cw.list_identity_sequence(result),separators=(",",":"),allow_nan=False))
