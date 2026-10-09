class Solution:
    def solve(self, root):
        if root is None:
            return True
        order=[root]
        for node in order:
            if node.left is not None:
                order.append(node.left)
            if node.right is not None:
                order.append(node.right)
        heights={}
        for node in reversed(order):
            a=0 if node.left is None else heights[node.left]
            b=0 if node.right is None else heights[node.right]
            if abs(a-b)>1:
                return False
            heights[node]=1+max(a,b)
        return True
