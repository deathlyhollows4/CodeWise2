class Solution:
    def solve(self, head, k):
        if head is None:
            return None
        tail=head
        length=1
        while tail.next is not None:
            tail=tail.next
            length+=1
        amount=k%length
        if amount==0:
            return head
        new_tail=head
        for _ in range(length-amount-1):
            new_tail=new_tail.next
        new_head=new_tail.next
        tail.next=head
        new_tail.next=None
        return new_head
