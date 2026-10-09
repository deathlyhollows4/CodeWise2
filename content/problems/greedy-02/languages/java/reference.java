class Solution {
    public int solve(int[] gas, int[] cost) {
        if(gas.length==0) return -1;
        long total=0,tank=0;
        int start=0;
        for(int i=0;i<gas.length;i++) {
            long delta=(long)gas[i]-cost[i];
            total+=delta; tank+=delta;
            if(tank<0) {tank=0; start=i+1;}
        }
        return total<0 ? -1 : start;
    }
}
