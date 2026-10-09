class Solution {
    public int solve(int target, int startFuel, int[][] stations) {
        java.util.PriorityQueue<Integer> available=new java.util.PriorityQueue<>(java.util.Collections.reverseOrder());
        long reach=startFuel;
        int index=0,count=0;
        while(reach<target) {
            while(index<stations.length && stations[index][0]<=reach) available.add(stations[index++][1]);
            if(available.isEmpty()) return -1;
            reach+=available.remove(); count++;
        }
        return count;
    }
}
