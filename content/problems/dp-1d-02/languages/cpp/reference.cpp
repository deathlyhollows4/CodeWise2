class Solution {
public:
    long long solve(vector<int> costsA, vector<int> costsB, int switchCost) {
        long long a=0,b=0;
        for(int day=0;day<(int)costsA.size();day++) {
            long long nextA=min(a,b+switchCost)+costsA[day];
            long long nextB=min(b,a+switchCost)+costsB[day];
            a=nextA; b=nextB;
        }
        return min(a,b);
    }
};
