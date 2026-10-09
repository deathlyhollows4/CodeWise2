class Solution {
    public long solve(int[] values) {
        long total=0;
        for(int bit=0;bit<20;bit++){long ones=0;for(int value:values)if((value&(1<<bit))!=0)ones++;total+=ones*(values.length-ones)*(1L<<bit);}
        return total;
    }
}
