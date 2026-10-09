class Solution:
    def solve(self, values):
        low = high = best = values[0]
        for value in values[1:]:
            a, b = low * value, high * value
            low, high = min(value, a, b), max(value, a, b)
            best = max(best, high)
        return best
