class Solution {
    public int solve(int[] values) {
        if(values.length<2) return 0;
        int far=0,boundary=0,count=0;
        for(int i=0;i<values.length-1;i++) {
            far=Math.max(far,i+values[i]);
            if(i==boundary) {
                if(far<=i) return -1;
                count++; boundary=far;
                if(boundary>=values.length-1) return count;
            }
        }
        return -1;
    }
}
