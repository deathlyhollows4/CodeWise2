class Solution:
    def solve(self, head, k):
        lead=head
        for _ in range(k):
            if lead is None:
                return None
            lead=lead.next
        follow=head
        while lead is not None:
            lead=lead.next
            follow=follow.next
        return follow
