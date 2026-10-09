class Solution:
    def solve(self, costs):
        n = len(costs)
        if n < 2:
            return 0
        size = 1 << n
        d = [[float("inf")]*n for _ in range(size)]
        d[1][0] = 0
        for mask in range(1, size, 2):
            for last in range(n):
                if d[mask][last] == float("inf"):
                    continue
                for next_stop in range(1, n):
                    if not mask & (1 << next_stop):
                        new_mask = mask | (1 << next_stop)
                        d[new_mask][next_stop] = min(d[new_mask][next_stop], d[mask][last]+costs[last][next_stop])
        return min(d[-1][last]+costs[last][0] for last in range(1, n))
