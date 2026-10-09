class Solution:
    def solve(self, a, days):
        lo, hi = max(a, default=0), sum(a)
        while lo < hi:
            mid = lo+(hi-lo)//2
            load, needed = 0, 1
            for value in a:
                if load+value > mid:
                    needed += 1
                    load = 0
                load += value
            if needed <= days:
                hi = mid
            else:
                lo = mid+1
        return lo
