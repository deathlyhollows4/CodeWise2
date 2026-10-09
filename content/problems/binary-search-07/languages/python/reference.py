class Solution:
    def solve(self, a, t):
        lo, hi = 0, len(a)-1
        while lo <= hi:
            mid = lo+(hi-lo)//2
            if a[mid] == t:
                return mid
            if a[lo] <= a[mid]:
                if a[lo] <= t < a[mid]:
                    hi = mid-1
                else:
                    lo = mid+1
            else:
                if a[mid] < t <= a[hi]:
                    lo = mid+1
                else:
                    hi = mid-1
        return -1
