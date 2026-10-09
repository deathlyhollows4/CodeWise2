class Solution:
    def solve(self, root):
        level=[] if root is None else [root]
        depth=0
        while level:
            depth+=1
            following=[]
            for node in level:
                if node.left is not None:
                    following.append(node.left)
                if node.right is not None:
                    following.append(node.right)
            level=following
        return depth
