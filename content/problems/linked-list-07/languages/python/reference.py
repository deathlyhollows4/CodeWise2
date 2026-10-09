class Solution:
    def solve(self, data):
        head=data.heads[0]
        if head is None:
            return None
        copies={head:ListNode(head.val)}
        queue=[head]
        for node in queue:
            for child in (node.next,node.random):
                if child is not None and child not in copies:
                    copies[child]=ListNode(child.val)
                    queue.append(child)
            clone=copies[node]
            clone.next=None if node.next is None else copies[node.next]
            clone.random=None if node.random is None else copies[node.random]
        return copies[head]
