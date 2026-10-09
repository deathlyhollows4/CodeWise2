class Solution:
    def solve(self, head, value):
        while head is not None and head.val==value:
            head=head.next
        cursor=head
        while cursor is not None and cursor.next is not None:
            if cursor.next.val==value:
                cursor.next=cursor.next.next
            else:
                cursor=cursor.next
        return head
