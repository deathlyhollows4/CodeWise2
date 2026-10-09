class Solution:
    def solve(self, commands):
        stack=[]
        out=[]
        for command in commands:
            if command==-1:
                if stack:
                    stack.pop()
            else:
                stack.append(command)
            out.append(stack[-1] if stack else -1)
        return out
