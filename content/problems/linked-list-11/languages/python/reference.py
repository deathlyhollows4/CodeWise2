class Solution:
    def solve(self, head):
        if head is None or head.next is None:
            return head
        slow,fast=head,head.next
        while fast is not None and fast.next is not None:
            slow=slow.next
            fast=fast.next.next
        right=slow.next
        slow.next=None
        a,b=self.solve(head),self.solve(right)
        dummy=ListNode(0)
        tail=dummy
        while a is not None and b is not None:
            if a.val<=b.val:
                tail.next=a
                a=a.next
            else:
                tail.next=b
                b=b.next
            tail=tail.next
        tail.next=a if a is not None else b
        return dummy.next
