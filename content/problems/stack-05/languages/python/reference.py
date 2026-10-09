class Solution:
    def solve(self, values):
        n=len(values)
        out=[-1]*n
        stack=[]
        for i in range(2*n):
            index=i%n
            while stack and values[index]>values[stack[-1]]:
                out[stack.pop()]=values[index]
            if i<n:
                stack.append(index)
        return out
