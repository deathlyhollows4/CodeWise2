class Solution:
    def solve(self, values):
        counts = {}
        for value in values:
            counts[value] = counts.get(value, 0) + 1
        return [[value, counts[value]] for value in sorted(counts)]
