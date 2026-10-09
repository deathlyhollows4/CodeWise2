class Solution:
    def solve(self, values):
        result=0
        for value in values:
            result^=value
        return result
