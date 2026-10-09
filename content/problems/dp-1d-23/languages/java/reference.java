class Solution {
    public long solve(int[] starts, int[] durations, int[] rewards) {
        int n=starts.length;
        Integer[] order=new Integer[n];
        for(int i=0;i<n;i++) order[i]=i;
        java.util.Arrays.sort(order,(a,b)->Integer.compare(starts[a]+durations[a],starts[b]+durations[b]));
        long[] dp=new long[n+1];
        for(int i=0;i<n;i++) {
            int job=order[i],lo=0,hi=i;
            while(lo<hi) {
                int mid=lo+(hi-lo)/2,prior=order[mid];
                if(starts[prior]+durations[prior]<=starts[job]) lo=mid+1;
                else hi=mid;
            }
            dp[i+1]=Math.max(dp[i],rewards[job]+dp[lo]);
        }
        return dp[n];
    }
}
