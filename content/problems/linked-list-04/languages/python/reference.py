class Solution:
    def solve(self, data):
        head=data.heads[0]
        slow=fast=head
        while fast is not None and fast.next is not None:
            slow=slow.next
            fast=fast.next.next
            if slow is fast:
                slow=head
                while slow is not fast:
                    slow=slow.next
                    fast=fast.next
                return slow
        return None
