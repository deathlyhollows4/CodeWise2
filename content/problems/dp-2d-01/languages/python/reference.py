class Solution:
    def solve(self, grid):
        if not grid or not grid[0]:
            return 0
        dp = [0]*len(grid[0])
        dp[0] = 1
        for row in grid:
            for c, closed in enumerate(row):
                dp[c] = 0 if closed else (dp[c]+(dp[c-1] if c else 0))%1000000007
        return dp[-1]
