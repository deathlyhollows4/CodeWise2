class Solution:
    def solve(self, left, right):
        dummy=ListNode(0)
        tail=dummy
        carry=0
        while left is not None or right is not None or carry:
            total=carry+(left.val if left is not None else 0)+(right.val if right is not None else 0)
            tail.next=ListNode(total%10)
            tail=tail.next
            carry=total//10
            if left is not None:
                left=left.next
            if right is not None:
                right=right.next
        last_nonzero=None
        cursor=dummy.next
        while cursor is not None:
            if cursor.val!=0:
                last_nonzero=cursor
            cursor=cursor.next
        if last_nonzero is None:
            return ListNode(0)
        last_nonzero.next=None
        return dummy.next
