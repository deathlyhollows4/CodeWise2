class Solution:
    def solve(self, root, value):
        while root is not None:
            if root.val==value:
                return True
            root=root.left if value<root.val else root.right
        return False
