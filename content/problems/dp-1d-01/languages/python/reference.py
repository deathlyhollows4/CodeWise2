class Solution:
    def solve(self, n):
        a, b = 1, 1
        for i in range(2, n+1):
            a, b = b, (a+b)%1000000007
        return 1 if n == 0 else b
