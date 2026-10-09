class Solution:
    def solve(self, root):
        stack=[] if root is None else [(root,0)]
        answer=0
        while stack:
            node,parity=stack.pop()
            if node.val^parity:
                answer+=1
                parity^=1
            if node.left is not None:
                stack.append((node.left,parity))
            if node.right is not None:
                stack.append((node.right,parity))
        return answer
