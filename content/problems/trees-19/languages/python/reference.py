class Solution:
    def solve(self, root, value):
        if root is None:
            return TreeNode(value)
        node=root
        while node.val!=value:
            side="left" if value<node.val else "right"
            child=getattr(node,side)
            if child is None:
                setattr(node,side,TreeNode(value))
                break
            node=child
        return root
