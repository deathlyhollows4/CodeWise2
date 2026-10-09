class Solution:
    def solve(self, values):
        total = 0
        for bit in range(20):
            ones = sum(1 for value in values if value & (1 << bit))
            total += ones * (len(values) - ones) * (1 << bit)
        return total
