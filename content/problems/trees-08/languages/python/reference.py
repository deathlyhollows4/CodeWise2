class Solution:
    def solve(self, root):
        stack=[] if root is None else [root]
        while stack:
            node=stack.pop()
            node.left,node.right=node.right,node.left
            if node.left is not None:
                stack.append(node.left)
            if node.right is not None:
                stack.append(node.right)
        return root
