class Solution {
public:
    long long solve(vector<int> prices) {
        long long hold=-(1LL<<60),sold=-(1LL<<60),rest=0;
        for(int price:prices) {
            long long nextHold=max(hold,rest-price);
            long long nextSold=hold+price;
            long long nextRest=max(rest,sold);
            hold=nextHold; sold=nextSold; rest=nextRest;
        }
        return max(rest,sold);
    }
};
