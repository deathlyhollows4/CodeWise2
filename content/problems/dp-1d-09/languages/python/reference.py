class Solution:
    def solve(self, a, width):
        if any(value > width for value in a):
            return -1
        n = len(a)
        best = [float("inf")]*(n+1)
        best[n] = 0
        for start in range(n-1, -1, -1):
            used = 0
            for end in range(start, n):
                used += a[end]+(0 if end == start else 1)
                if used > width:
                    break
                cost = 0 if end == n-1 else (width-used)**2
                best[start] = min(best[start], cost+best[end+1])
        return best[0]
