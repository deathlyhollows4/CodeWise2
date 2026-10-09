class Solution:
    def solve(self, root, k):
        stack=[]
        node=root
        while node is not None or stack:
            while node is not None:
                stack.append(node)
                node=node.left
            node=stack.pop()
            k-=1
            if k==0:
                return node
            node=node.right
        return None
