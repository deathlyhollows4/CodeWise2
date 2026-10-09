class Solution {
    public long solve(int[] ratings) {
        int[] amount=new int[ratings.length];
        java.util.Arrays.fill(amount,1);
        for(int i=1;i<ratings.length;i++)
            if(ratings[i]>ratings[i-1]) amount[i]=amount[i-1]+1;
        for(int i=ratings.length-2;i>=0;i--)
            if(ratings[i]>ratings[i+1]) amount[i]=Math.max(amount[i],amount[i+1]+1);
        long total=0;
        for(int value:amount) total+=value;
        return total;
    }
}
