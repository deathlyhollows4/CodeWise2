class Solution:
    def solve(self, root):
        if root is None:
            return []
        def leaf(node):
            return node.left is None and node.right is None
        if leaf(root):
            return [root.val]
        out=[root.val]
        node=root.left
        while node is not None:
            if not leaf(node):
                out.append(node.val)
            node=node.left if node.left is not None else node.right
        stack=[root]
        while stack:
            node=stack.pop()
            if leaf(node):
                out.append(node.val)
            else:
                if node.right is not None:
                    stack.append(node.right)
                if node.left is not None:
                    stack.append(node.left)
        right=[]
        node=root.right
        while node is not None:
            if not leaf(node):
                right.append(node.val)
            node=node.right if node.right is not None else node.left
        return out+right[::-1]
