class Solution:
    def solve(self, data):
        left,right=data.heads
        a,b=left,right
        x=y=0
        p=a
        while p is not None:
            x+=1
            p=p.next
        p=b
        while p is not None:
            y+=1
            p=p.next
        while x>y:
            a=a.next
            x-=1
        while y>x:
            b=b.next
            y-=1
        while a is not b:
            a,b=a.next,b.next
        common=a
        dummy=ListNode(0)
        tail=dummy
        while left is not common or right is not common:
            if right is common or left is not common and left.val<=right.val:
                following=left.next
                tail.next=left
                tail=left
                left=following
            else:
                following=right.next
                tail.next=right
                tail=right
                right=following
        tail.next=common
        return dummy.next
