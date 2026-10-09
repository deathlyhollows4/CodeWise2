class Solution:
    def solve(self, items, capacity):
        d = [0]*(capacity+1)
        for weight, value in items:
            for c in range(capacity, weight-1, -1):
                d[c] = max(d[c], d[c-weight]+value)
        return d[capacity]
