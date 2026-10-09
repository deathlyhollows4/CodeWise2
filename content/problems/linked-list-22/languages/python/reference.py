class Solution:
    def solve(self, head):
        if head is None:
            return None
        stack=[head]
        previous=None
        while stack:
            node=stack.pop()
            if node.next is not None:
                stack.append(node.next)
            if node.child is not None:
                stack.append(node.child)
            node.next=None
            node.child=None
            node.prev=previous
            if previous is not None:
                previous.next=node
            previous=node
        return head
