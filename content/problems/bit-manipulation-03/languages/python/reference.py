class Solution:
    def solve(self, value):
        result=0
        for _ in range(32):
            result=(result<<1)|(value&1)
            value>>=1
        return result
