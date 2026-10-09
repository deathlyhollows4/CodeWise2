class Solution:
    def solve(self, left, right):
        n=len(left)
        dp=[10**30]*(1<<n)
        dp[0]=0
        for mask in range(len(dp)):
            i=mask.bit_count()
            for j in range(n):
                if not mask & (1<<j):
                    next=mask | (1<<j)
                    dp[next]=min(dp[next],dp[mask]+(left[i]^right[j]))
        return dp[-1]
