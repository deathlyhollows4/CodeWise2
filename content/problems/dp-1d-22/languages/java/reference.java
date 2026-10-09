class Solution {
    public int solve(int n) {
        if(n==0) return 1;
        long a=1,b=0;
        for(int size=2;size<=n;size++) {
            long next=(size-1)*(a+b)%1000000007L;
            a=b; b=next;
        }
        return (int)b;
    }
}
