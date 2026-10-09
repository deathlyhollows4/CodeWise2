class Solution:
    def solve(self, grid):
        rows, cols = len(grid), len(grid[0]) if grid else 0
        distance = [[-2 if v == 1 else -1 for v in row] for row in grid]
        queue = []
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    distance[r][c] = 0
                    queue.append((r,c))
        for r,c in queue:
            for x,y in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                if 0 <= x < rows and 0 <= y < cols and distance[x][y] == -1:
                    distance[x][y] = distance[r][c]+1
                    queue.append((x,y))
        return distance
