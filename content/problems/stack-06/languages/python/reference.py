class Solution:
    def solve(self, values):
        stack=[]
        best=0
        for i in range(len(values)+1):
            height=values[i] if i<len(values) else 0
            while stack and values[stack[-1]]>height:
                h=values[stack.pop()]
                left=stack[-1] if stack else -1
                best=max(best,h*(i-left-1))
            stack.append(i)
        return best
