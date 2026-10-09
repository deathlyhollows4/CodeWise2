class Solution {
public:
    long long solve(vector<int> starts, vector<int> durations, vector<int> rewards) {
        int n=starts.size();
        vector<int> order(n);
        iota(order.begin(),order.end(),0);
        sort(order.begin(),order.end(),[&](int a,int b){return starts[a]+durations[a]<starts[b]+durations[b];});
        vector<long long> dp(n+1,0);
        for(int i=0;i<n;i++) {
            int job=order[i],lo=0,hi=i;
            while(lo<hi) {
                int mid=lo+(hi-lo)/2,prior=order[mid];
                if(starts[prior]+durations[prior]<=starts[job]) lo=mid+1;
                else hi=mid;
            }
            dp[i+1]=max(dp[i],rewards[job]+dp[lo]);
        }
        return dp[n];
    }
};
