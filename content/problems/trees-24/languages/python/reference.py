class Solution:
    def solve(self, preorder, inorder):
        if not preorder:
            return None
        root=TreeNode(preorder[0])
        stack=[root]
        at=0
        for value in preorder[1:]:
            child=TreeNode(value)
            parent=stack[-1]
            if parent.val!=inorder[at]:
                parent.left=child
            else:
                while stack and stack[-1].val==inorder[at]:
                    parent=stack.pop()
                    at+=1
                parent.right=child
            stack.append(child)
        return root
