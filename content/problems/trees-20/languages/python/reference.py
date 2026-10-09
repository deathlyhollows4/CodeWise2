class Solution:
    def solve(self, root, value):
        dummy=TreeNode(0)
        dummy.left=root
        parent=dummy
        node=root
        side="left"
        while node is not None and node.val!=value:
            parent=node
            side="left" if value<node.val else "right"
            node=getattr(node,side)
        if node is None:
            return root
        if node.left is None or node.right is None:
            setattr(parent,side,node.left if node.left is not None else node.right)
        else:
            parent=node
            successor=node.right
            side="right"
            while successor.left is not None:
                parent=successor
                successor=successor.left
                side="left"
            node.val=successor.val
            setattr(parent,side,successor.right)
        return dummy.left
