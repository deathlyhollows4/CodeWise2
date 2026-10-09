class Solution:
    def solve(self, a):
        lo, hi = 0, len(a)-1
        while lo < hi:
            mid = lo+(hi-lo)//2
            if a[mid] < a[mid+1]:
                lo = mid+1
            else:
                hi = mid
        return lo
