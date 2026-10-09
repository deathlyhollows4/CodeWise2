class Solution {
    public long solve(int[] weights) {
        java.util.Arrays.sort(weights);
        long[] merged=new long[Math.max(0,weights.length-1)];
        int i=0,j=0,size=0;
        long total=0;
        for(int step=1;step<weights.length;step++) {
            long sum=0;
            for(int pick=0;pick<2;pick++) {
                if(i<weights.length && (j>=size || weights[i]<=merged[j])) sum+=weights[i++];
                else sum+=merged[j++];
            }
            merged[size++]=sum; total+=sum;
        }
        return total;
    }
}
