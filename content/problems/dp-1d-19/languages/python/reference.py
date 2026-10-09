class Solution:
    def solve(self, n):
        if n < 3:
            return [1, 1, 2][n]
        a, b, c = 1, 1, 2
        for width in range(3, n+1):
            a, b, c = b, c, (2*c+a) % 1000000007
        return c
