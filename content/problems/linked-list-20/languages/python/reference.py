class Solution:
    def solve(self, head):
        dummy=ListNode(0,head)
        last={}
        total=0
        node=dummy
        while node is not None:
            total+=node.val
            last[total]=node
            node=node.next
        total=0
        node=dummy
        while node is not None:
            total+=node.val
            node.next=last[total].next
            node=node.next
        return dummy.next
