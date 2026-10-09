class Solution:
    def solve(self, values):
        n=len(values)
        left=[0]*n
        right=[0]*n
        stack=[]
        for i,value in enumerate(values):
            while stack and values[stack[-1]]>=value:
                stack.pop()
            left[i]=i-(stack[-1] if stack else -1)
            stack.append(i)
        stack=[]
        for i in range(n-1,-1,-1):
            while stack and values[stack[-1]]>values[i]:
                stack.pop()
            right[i]=(stack[-1] if stack else n)-i
            stack.append(i)
        return sum(values[i]*left[i]*right[i] for i in range(n))
