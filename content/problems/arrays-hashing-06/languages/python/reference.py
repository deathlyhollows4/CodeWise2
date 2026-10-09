class Solution:
    def solve(self, values):
        n=len(values)
        return n*(n+1)//2-sum(values)
