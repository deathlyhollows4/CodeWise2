class Solution:
    def solve(self, pushes, pops):
        if len(pushes)!=len(pops):
            return False
        stack=[]
        next_pop=0
        for value in pushes:
            stack.append(value)
            while stack and next_pop<len(pops) and stack[-1]==pops[next_pop]:
                stack.pop()
                next_pop+=1
        return next_pop==len(pops) and not stack
