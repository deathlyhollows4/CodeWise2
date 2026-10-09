class Solution:
    def solve(self, a, b):
        dp = [0]*(len(b)+1)
        for x in a:
            diagonal = 0
            for j in range(1, len(b)+1):
                old = dp[j]
                dp[j] = diagonal+1 if x == b[j-1] else max(dp[j], dp[j-1])
                diagonal = old
        return dp[-1]
