class Solution:
    def solve(self, root):
        stack=[] if root is None else [root]
        count=0
        while stack:
            node=stack.pop()
            count+=1
            if node.left is not None:
                stack.append(node.left)
            if node.right is not None:
                stack.append(node.right)
        return count
