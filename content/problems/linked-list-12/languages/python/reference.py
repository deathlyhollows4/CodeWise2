class Solution:
    def solve(self, capacity, commands, keys, values):
        class Entry:
            def __init__(self,key,value):
                self.key,self.value=key,value
                self.prev=self.next=None
        head,tail=Entry(0,0),Entry(0,0)
        head.next=tail
        tail.prev=head
        cache={}
        def unlink(node):
            node.prev.next=node.next
            node.next.prev=node.prev
        def front(node):
            node.next=head.next
            node.prev=head
            head.next.prev=node
            head.next=node
        out=[]
        for command,key,value in zip(commands,keys,values):
            node=cache.get(key)
            if command=="get":
                if node is None:
                    out.append(-1)
                else:
                    out.append(node.value)
                    unlink(node)
                    front(node)
            else:
                out.append(0)
                if capacity==0:
                    continue
                if node is not None:
                    node.value=value
                    unlink(node)
                    front(node)
                else:
                    node=Entry(key,value)
                    cache[key]=node
                    front(node)
                    if len(cache)>capacity:
                        old=tail.prev
                        unlink(old)
                        del cache[old.key]
        return out
