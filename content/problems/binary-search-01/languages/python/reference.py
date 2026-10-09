class Solution:
    def solve(self, values, target):
        lo, hi = 0, len(values)-1
        while lo <= hi:
            mid = lo+(hi-lo)//2
            if values[mid] == target:
                return mid
            if values[mid] < target:
                lo = mid+1
            else:
                hi = mid-1
        return -1
