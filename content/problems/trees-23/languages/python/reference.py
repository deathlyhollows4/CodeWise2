class Solution:
    def solve(self, root, lo, hi):
        stack=[] if root is None else [root]
        total=0
        while stack:
            node=stack.pop()
            if node.val<lo:
                if node.right is not None:
                    stack.append(node.right)
            elif node.val>hi:
                if node.left is not None:
                    stack.append(node.left)
            else:
                total+=node.val
                if node.left is not None:
                    stack.append(node.left)
                if node.right is not None:
                    stack.append(node.right)
        return total
