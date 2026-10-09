class Solution:
    def solve(self, grid):
        if not grid or not grid[0]:
            return 0
        n = len(grid[0])
        d = {(0, n-1): grid[0][0]+(grid[0][-1] if n > 1 else 0)}
        for row in grid[1:]:
            next_states = {}
            for (a, b), score in d.items():
                for x in range(max(0, a-1), min(n, a+2)):
                    for y in range(max(0, b-1), min(n, b+2)):
                        value = score+row[x]+(row[y] if x != y else 0)
                        next_states[x, y] = max(next_states.get((x, y), -1), value)
            d = next_states
        return max(d.values())
