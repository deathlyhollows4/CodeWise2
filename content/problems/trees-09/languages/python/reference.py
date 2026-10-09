class Solution:
    def solve(self, a, b):
        stack=[(a,b)]
        while stack:
            x,y=stack.pop()
            if x is None or y is None:
                if x is not y:
                    return False
                continue
            if x.val!=y.val:
                return False
            stack.append((x.left,y.left))
            stack.append((x.right,y.right))
        return True
