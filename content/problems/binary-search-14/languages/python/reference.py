class Solution:
    def solve(self, rows, columns, k):
        if rows > columns:
            rows, columns = columns, rows
        lo, hi = 1, rows*columns
        while lo < hi:
            mid = lo+(hi-lo)//2
            count = 0
            for i in range(1, rows+1):
                count += min(columns, mid//i)
                if count >= k:
                    break
            if count >= k:
                hi = mid
            else:
                lo = mid+1
        return lo
