class Solution:
    def solve(self, root, direction):
        if root is None:
            return None
        if direction=="LEFT":
            pivot=root.right
            if pivot is None:
                return root
            root.right=pivot.left
            pivot.left=root
            return pivot
        pivot=root.left
        if pivot is None:
            return root
        root.left=pivot.right
        pivot.right=root
        return pivot
