class Solution {
    public long solve(int[][] jobs) {
        java.util.Arrays.sort(jobs,(a,b)->Integer.compare(b[1],a[1]));
        boolean[] used=new boolean[2001];
        long total=0;
        for(int[] job:jobs)
            for(int time=job[0];time>=1;time--)
                if(!used[time]) {used[time]=true; total+=job[1]; break;}
        return total;
    }
}
