class Solution:
    def solve(self, head, value):
        node=ListNode(value)
        if head is None or value<=head.val:
            node.next=head
            return node
        cursor=head
        while cursor.next is not None and cursor.next.val<value:
            cursor=cursor.next
        node.next=cursor.next
        cursor.next=node
        return head
