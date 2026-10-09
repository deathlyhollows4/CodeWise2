class Solution:
    def solve(self, lo, hi):
        shift=0
        while lo!=hi:
            lo >>= 1
            hi >>= 1
            shift+=1
        return lo<<shift
