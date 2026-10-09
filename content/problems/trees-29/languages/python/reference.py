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
        state={}
        for node in reversed(order):
            a=(0,0) if node.left is None else state[node.left]
            b=(0,0) if node.right is None else state[node.right]
            state[node]=(node.val+a[1]+b[1],max(a)+max(b))
        return max(state[root])
