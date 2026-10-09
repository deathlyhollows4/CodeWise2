class Solution:
    def solve(self, grid):
        rows, cols = len(grid), len(grid[0]) if grid else 0
        seen, shapes = set(), set()
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != 1 or (r,c) in seen:
                    continue
                queue = [(r,c)]
                seen.add((r,c))
                for x,y in queue:
                    for a,b in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                        if 0 <= a < rows and 0 <= b < cols and grid[a][b] == 1 and (a,b) not in seen:
                            seen.add((a,b))
                            queue.append((a,b))
                shapes.add(tuple(sorted((x-r,y-c) for x,y in queue)))
        return len(shapes)
