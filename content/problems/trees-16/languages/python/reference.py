class Solution:
    def solve(self, root):
        stack=[] if root is None else [(root,float("-inf"))]
        count=0
        while stack:
            node,prior=stack.pop()
            if node.val>=prior:
                count+=1
            next_max=max(prior,node.val)
            if node.left is not None:
                stack.append((node.left,next_max))
            if node.right is not None:
                stack.append((node.right,next_max))
        return count
