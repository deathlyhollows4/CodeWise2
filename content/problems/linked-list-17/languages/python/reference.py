class Solution:
    def solve(self, head, cutIds, afterIds):
        nodes=[]
        previous={}
        before=None
        cursor=head
        while cursor is not None:
            nodes.append(cursor)
            previous[cursor]=before
            before=cursor
            cursor=cursor.next
        for cut,after_id in zip(cutIds,afterIds):
            node=nodes[cut]
            after=None if after_id<0 else nodes[after_id]
            if node is after:
                continue
            before=previous[node]
            following=node.next
            if before is None:
                head=following
            else:
                before.next=following
            if following is not None:
                previous[following]=before
            if after is None:
                node.next=head
                previous[node]=None
                if head is not None:
                    previous[head]=node
                head=node
            else:
                node.next=after.next
                after.next=node
                previous[node]=after
                if node.next is not None:
                    previous[node.next]=node
        return head
