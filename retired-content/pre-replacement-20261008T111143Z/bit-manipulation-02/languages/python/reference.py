class Solution:
    def solve(self, value):
        return value>0 and value&(value-1)==0
