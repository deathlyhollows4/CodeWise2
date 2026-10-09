class Solution:
    def solve(self, values):
        result=[0]
        for value in values:
            result.append(result[-1]+value)
        return result
