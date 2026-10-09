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
        down={}
        best=None
        for node in reversed(order):
            a=0 if node.left is None else max(0,down[node.left])
            b=0 if node.right is None else max(0,down[node.right])
            total=node.val+a+b
            best=total if best is None else max(best,total)
            down[node]=node.val+max(a,b)
        return best
