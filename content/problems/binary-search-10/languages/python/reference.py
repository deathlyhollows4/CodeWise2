class Solution:
    def solve(self, a, pause, deadline):
        if not a:
            return 0
        waiting = pause*(len(a)-1)
        if waiting+len(a) > deadline:
            return -1
        lo, hi = 1, max(a)
        while lo < hi:
            mid = lo+(hi-lo)//2
            duration = waiting+sum((x+mid-1)//mid for x in a)
            if duration <= deadline:
                hi = mid
            else:
                lo = mid+1
        return lo
