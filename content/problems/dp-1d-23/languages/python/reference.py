class Solution:
    def solve(self, starts, durations, rewards):
        jobs = sorted((start+duration, start, reward) for start, duration, reward in zip(starts, durations, rewards))
        dp = [0]*(len(jobs)+1)
        for i, (end, start, reward) in enumerate(jobs):
            lo, hi = 0, i
            while lo < hi:
                mid = (lo+hi)//2
                if jobs[mid][0] <= start:
                    lo = mid+1
                else:
                    hi = mid
            dp[i+1] = max(dp[i], reward+dp[lo])
        return dp[-1]
