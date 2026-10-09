class Solution:
    def solve(self, a, k):
        lo, hi = 0, a[-1]-a[0]
        while lo < hi:
            mid = lo+(hi-lo+1)//2
            count, last = 1, a[0]
            for value in a[1:]:
                if value-last >= mid:
                    count += 1
                    last = value
            if count >= k:
                lo = mid
            else:
                hi = mid-1
        return lo
