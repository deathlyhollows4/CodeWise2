class Solution:
    def solve(self, head):
        if head is None or head.next is None:
            return head
        slow=fast=head
        while fast.next is not None and fast.next.next is not None:
            slow=slow.next
            fast=fast.next.next
        second=slow.next
        slow.next=None
        previous=None
        while second is not None:
            following=second.next
            second.next=previous
            previous=second
            second=following
        second=previous
        first=head
        while second is not None:
            a,b=first.next,second.next
            first.next=second
            second.next=a
            first,second=a,b
        return head
