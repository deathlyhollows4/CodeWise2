class Solution:
    def solve(self, root, target):
        stack=[] if root is None else [(root,0)]
        while stack:
            node,prior=stack.pop()
            total=prior+node.val
            if node.left is None and node.right is None and total==target:
                return True
            if node.left is not None:
                stack.append((node.left,total))
            if node.right is not None:
                stack.append((node.right,total))
        return False
