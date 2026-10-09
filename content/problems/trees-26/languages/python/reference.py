class Solution:
    def solve(self, root, target):
        frequency={0:1}
        stack=[] if root is None else [(root,0,False)]
        answer=0
        while stack:
            node,prior,exit=stack.pop()
            if exit:
                count=frequency[prior]-1
                if count:
                    frequency[prior]=count
                else:
                    del frequency[prior]
                continue
            total=prior+node.val
            answer+=frequency.get(total-target,0)
            frequency[total]=frequency.get(total,0)+1
            stack.append((node,total,True))
            if node.right is not None:
                stack.append((node.right,total,False))
            if node.left is not None:
                stack.append((node.left,total,False))
        return answer
