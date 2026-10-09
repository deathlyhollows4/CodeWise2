class Solution:
    def solve(self, values):
        seen = set()
        for i, value in enumerate(values):
            if value in seen:
                return i
            seen.add(value)
        return -1
