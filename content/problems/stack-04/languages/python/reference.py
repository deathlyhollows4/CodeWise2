class Solution:
    def solve(self, values):
        out=[0]*len(values)
        stack=[]
        for i,value in enumerate(values):
            while stack and value>values[stack[-1]]:
                old=stack.pop();out[old]=i-old
            stack.append(i)
        return out
