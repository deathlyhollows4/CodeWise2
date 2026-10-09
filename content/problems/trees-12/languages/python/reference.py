class Solution:
    def solve(self, root):
        if root is None:
            return 0
        state={}
        stack=[(root,False)]
        cameras=0
        while stack:
            node,done=stack.pop()
            if not done:
                stack.append((node,True))
                if node.right is not None:
                    stack.append((node.right,False))
                if node.left is not None:
                    stack.append((node.left,False))
                continue
            a=2 if node.left is None else state[node.left]
            b=2 if node.right is None else state[node.right]
            if a==0 or b==0:
                state[node]=1
                cameras+=1
            else:
                state[node]=2 if a==1 or b==1 else 0
        return cameras+(1 if state[root]==0 else 0)
