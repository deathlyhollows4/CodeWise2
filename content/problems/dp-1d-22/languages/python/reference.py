class Solution:
    def solve(self, n):
        if n == 0:
            return 1
        a, b = 1, 0
        for size in range(2, n+1):
            a, b = b, (size-1)*(a+b) % 1000000007
        return b
