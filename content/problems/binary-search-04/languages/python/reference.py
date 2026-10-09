class Solution:
    def solve(self, values, k):
        lo, hi = 0, len(values)
        while lo < hi:
            mid = lo+(hi-lo)//2
            if values[mid]-mid-1 < k:
                lo = mid+1
            else:
                hi = mid
        return lo+k
