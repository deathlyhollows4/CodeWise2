class Solution:
    def solve(self, root):
        stack=[] if root is None else [root]
        values=[]
        while stack:
            node=stack.pop()
            values.append(node.val)
            if node.right is not None:
                stack.append(node.right)
            if node.left is not None:
                stack.append(node.left)
        return values
