class Solution {
    public long solve(int[] prices) {
        long hold=Long.MIN_VALUE/4,sold=Long.MIN_VALUE/4,rest=0;
        for(int price:prices) {
            long nextHold=Math.max(hold,rest-price);
            long nextSold=hold+price;
            long nextRest=Math.max(rest,sold);
            hold=nextHold; sold=nextSold; rest=nextRest;
        }
        return Math.max(rest,sold);
    }
}
