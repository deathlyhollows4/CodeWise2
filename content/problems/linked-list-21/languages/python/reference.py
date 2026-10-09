class Solution:
    def solve(self, head, k):
        length=0
        node=head
        while node is not None:
            length+=1
            node=node.next
        size,remainder=divmod(length,k)
        parts=[]
        for i in range(k):
            parts.append(head)
            count=size+(1 if i<remainder else 0)
            for _ in range(1,count):
                head=head.next
            if head is not None:
                following=head.next
                head.next=None
                head=following
        return parts
