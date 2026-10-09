class Solution:
    def solve(self, head, left, right):
        dummy=ListNode(0,head)
        before=dummy
        for _ in range(left):
            before=before.next
        first=before.next
        for _ in range(right-left):
            moved=first.next
            first.next=moved.next
            moved.next=before.next
            before.next=moved
        return dummy.next
