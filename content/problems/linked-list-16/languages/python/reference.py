class Solution:
    def solve(self, head):
        dummy=ListNode(0)
        tail=dummy
        while head is not None:
            last=head
            while last.next is not None and last.next.val==head.val:
                last=last.next
            after=last.next
            if last is head:
                tail.next=head
                tail=head
            head=after
        tail.next=None
        return dummy.next
