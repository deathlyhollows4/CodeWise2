class Solution:
    def solve(self, n):
        lo, hi, answer = 0, n, 0
        while lo <= hi:
            mid = lo+(hi-lo)//2
            if mid == 0 or mid <= n//mid:
                answer = mid
                lo = mid+1
            else:
                hi = mid-1
        return answer
