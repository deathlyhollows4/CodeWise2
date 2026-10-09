class Solution {
    public long solve(int[][] segments) {
        TreeMap<Integer,Long> changes=new TreeMap<>();
        for(int[] range:segments){if(range[0]==range[1])continue;changes.merge(range[0],(long)range[2],Long::sum);changes.merge(range[1],-(long)range[2],Long::sum);}
        long active=0,best=0;for(long change:changes.values()){active+=change;best=Math.max(best,active);}
        return best;
    }
}
