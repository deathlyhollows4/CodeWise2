class Solution:
    def solve(self, grid):
        n=len(grid)
        out=[[0]*n for _ in range(n)]
        for row in range(n):
            for col in range(n): out[col][n-1-row]=grid[row][col]
        return out
