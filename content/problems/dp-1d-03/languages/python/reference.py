class Solution:
    def solve(self, values):
        previous, best = 0, 0
        for value in values:
            previous, best = best, max(best, previous+value)
        return best
