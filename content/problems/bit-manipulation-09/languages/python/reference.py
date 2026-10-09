class Solution:
    def solve(self, value):
        if not value: return -1
        low=value & -value
        raised=value+low
        if raised>2147483647: return -1
        return raised+((raised^value)//low//4)
