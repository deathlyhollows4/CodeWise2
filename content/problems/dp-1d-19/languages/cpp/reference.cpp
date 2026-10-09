class Solution {
public:
    int solve(int n) {
        if(n<3) return n==2 ? 2 : 1;
        long long a=1,b=1,c=2;
        for(int width=3;width<=n; ++width) {
            long long next=(2*c+a)%1000000007LL;
            a=b; b=c; c=next;
        }
        return (int)c;
    }
};
