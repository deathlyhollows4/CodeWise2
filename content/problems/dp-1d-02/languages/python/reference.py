class Solution:
    def solve(self, costsA, costsB, switchCost):
        a = b = 0
        for cost_a, cost_b in zip(costsA, costsB):
            a, b = min(a, b+switchCost)+cost_a, min(b, a+switchCost)+cost_b
        return min(a, b)
