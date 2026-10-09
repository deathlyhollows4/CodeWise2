class Solution:
    def solve(self, head, pivot):
        low,high=ListNode(0),ListNode(0)
        a,b=low,high
        while head is not None:
            following=head.next
            head.next=None
            if head.val<pivot:
                a.next=head
                a=head
            else:
                b.next=head
                b=head
            head=following
        a.next=high.next
        return low.next
