class Solution:
    def solve(self, root):
        stack=[] if root is None else [(root,float("-inf"),float("inf"))]
        while stack:
            node,lo,hi=stack.pop()
            if not lo<node.val<hi:
                return False
            if node.left is not None:
                stack.append((node.left,lo,node.val))
            if node.right is not None:
                stack.append((node.right,node.val,hi))
        return True
