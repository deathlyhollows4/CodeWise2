class Solution:
    def solve(self, root):
        if root is None:
            return 0
        order=[root]
        for node in order:
            if node.left is not None:
                order.append(node.left)
            if node.right is not None:
                order.append(node.right)
        heights={}
        best=0
        for node in reversed(order):
            a=0 if node.left is None else heights[node.left]
            b=0 if node.right is None else heights[node.right]
            best=max(best,a+b)
            heights[node]=1+max(a,b)
        return best
