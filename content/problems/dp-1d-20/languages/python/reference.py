class Solution:
    def solve(self, days, costs):
        travel = set(days)
        dp = [0]*396
        for day in range(365, 0, -1):
            dp[day] = min(costs[0]+dp[day+1], costs[1]+dp[day+7], costs[2]+dp[day+30]) if day in travel else dp[day+1]
        return dp[1]
