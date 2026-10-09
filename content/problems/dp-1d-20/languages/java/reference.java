class Solution {
    public int solve(int[] days, int[] costs) {
        boolean[] travel=new boolean[366];
        for(int day:days) travel[day]=true;
        int[] dp=new int[396];
        for(int day=365;day>=1;day--)
            dp[day]=travel[day] ? Math.min(costs[0]+dp[day+1], Math.min(costs[1]+dp[day+7],costs[2]+dp[day+30])) : dp[day+1];
        return dp[1];
    }
}
