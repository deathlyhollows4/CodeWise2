class Solution:
    def solve(self, grid):
        if not grid or not grid[0]:
            return 0
        dp = [float("inf")]*len(grid[0])
        for r, row in enumerate(grid):
            for c, cost in enumerate(row):
                dp[c] = cost+(0 if r == 0 and c == 0 else min(dp[c], dp[c-1] if c else float("inf")))
        return dp[-1]
