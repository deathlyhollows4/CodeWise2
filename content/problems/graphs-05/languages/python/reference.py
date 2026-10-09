class Solution:
    def solve(self, grid):
        rows, cols = len(grid), len(grid[0]) if grid else 0
        if not cols:
            return 0
        ids = [[-1]*cols for _ in range(rows)]
        sizes = []
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != 1 or ids[r][c] >= 0:
                    continue
                label, queue = len(sizes), [(r,c)]
                ids[r][c] = label
                for x,y in queue:
                    for a,b in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                        if 0 <= a < rows and 0 <= b < cols and grid[a][b] == 1 and ids[a][b] < 0:
                            ids[a][b] = label
                            queue.append((a,b))
                sizes.append(len(queue))
        best = max(sizes, default=0)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 0:
                    near = {ids[x][y] for x,y in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)) if 0 <= x < rows and 0 <= y < cols and ids[x][y] >= 0}
                    best = max(best, 1+sum(sizes[k] for k in near))
        return best
