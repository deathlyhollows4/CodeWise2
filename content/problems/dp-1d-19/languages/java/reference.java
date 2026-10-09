class Solution {
    public int solve(int n) {
        if (n < 3) return new int[]{1,1,2}[n];
        long a=1,b=1,c=2;
        for (int width=3; width<=n; width++) {
            long next=(2*c+a)%1000000007L;
            a=b; b=c; c=next;
        }
        return (int)c;
    }
}
