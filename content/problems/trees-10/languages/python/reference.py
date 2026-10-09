class Solution:
    def solve(self, root):
        if root is None:
            return True
        queue=[root]
        missing=False
        for node in queue:
            if node is None:
                missing=True
                continue
            if missing:
                return False
            queue.append(node.left)
            queue.append(node.right)
        return True
