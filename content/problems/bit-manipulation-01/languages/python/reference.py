class Solution:
    def solve(self, value):
        count=0
        while value:
            value &= value-1
            count+=1
        return count
