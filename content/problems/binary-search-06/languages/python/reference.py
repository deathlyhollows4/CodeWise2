class Solution:
    def solve(self, values):
        lo, hi = 0, len(values)-1
        while lo < hi:
            mid = lo+(hi-lo)//2
            if values[mid] > values[hi]:
                lo = mid+1
            else:
                hi = mid
        return values[lo]
