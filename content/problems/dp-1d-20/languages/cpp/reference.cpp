class Solution {
public:
    int solve(vector<int> days, vector<int> costs) {
        vector<bool> travel(366,false);
        for(int day:days) travel[day]=true;
        vector<int> dp(396,0);
        for(int day=365;day>=1;day--)
            dp[day]=travel[day] ? min(costs[0]+dp[day+1],min(costs[1]+dp[day+7],costs[2]+dp[day+30])) : dp[day+1];
        return dp[1];
    }
};
