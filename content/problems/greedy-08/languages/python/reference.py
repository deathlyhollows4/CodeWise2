class Solution:
    def solve(self, weights):
        original = sorted(weights)
        merged = []
        i = j = total = 0
        for step in range(1, len(weights)):
            combined = 0
            for pick in range(2):
                if i < len(original) and (j >= len(merged) or original[i] <= merged[j]):
                    combined += original[i]
                    i += 1
                else:
                    combined += merged[j]
                    j += 1
            merged.append(combined)
            total += combined
        return total
