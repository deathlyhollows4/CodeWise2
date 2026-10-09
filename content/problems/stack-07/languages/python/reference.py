class Solution:
    def solve(self, tokens):
        stack=[]
        for token in tokens:
            if token in ("+","-","*"):
                right=stack.pop();left=stack.pop()
                stack.append(left+right if token=="+" else left-right if token=="-" else left*right)
            else:
                stack.append(int(token))
        return stack[-1]
