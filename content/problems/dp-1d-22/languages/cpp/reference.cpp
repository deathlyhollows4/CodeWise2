class Solution {
public:
    int solve(int n) {
        if(n==0) return 1;
        long long a=1,b=0;
        for(int size=2;size<=n;size++) {
            long long next=(size-1)*(a+b)%1000000007LL;
            a=b; b=next;
        }
        return (int)b;
    }
};
