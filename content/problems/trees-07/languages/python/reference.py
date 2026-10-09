class Solution:
    def solve(self, root):
        level=[] if root is None else [root]
        out=[]
        while level:
            out.append([node.val for node in level])
            following=[]
            for node in level:
                if node.left is not None:
                    following.append(node.left)
                if node.right is not None:
                    following.append(node.right)
            level=following
        return out
