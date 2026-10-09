class Solution:
    def solve(self, root):
        stack=[] if root is None else [(root,False)]
        height={}
        rows=[]
        while stack:
            node,done=stack.pop()
            if not done:
                stack.append((node,True))
                if node.right is not None:
                    stack.append((node.right,False))
                if node.left is not None:
                    stack.append((node.left,False))
                continue
            h=1+max(height[node.left] if node.left is not None else -1,height[node.right] if node.right is not None else -1)
            height[node]=h
            while len(rows)<=h:
                rows.append([])
            rows[h].append(node.val)
        return rows
