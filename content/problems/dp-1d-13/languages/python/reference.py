class Solution:
    def solve(self, values):
        ending = best = values[0]
        for value in values[1:]:
            ending = max(value, ending + value)
            best = max(best, ending)
        return best
