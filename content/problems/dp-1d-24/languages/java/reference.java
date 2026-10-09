class Solution {
    public int solve(int[] values) {
        if(values.length==0) return 0;
        int up=1,down=1;
        for(int i=1;i<values.length;i++) {
            if(values[i]>values[i-1]) up=down+1;
            else if(values[i]<values[i-1]) down=up+1;
        }
        return Math.max(up,down);
    }
}
