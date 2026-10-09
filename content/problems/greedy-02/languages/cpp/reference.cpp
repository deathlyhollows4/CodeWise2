class Solution {
public:
    int solve(vector<int> gas, vector<int> cost) {
        if(gas.empty()) return -1;
        long long total=0,tank=0;
        int start=0;
        for(int i=0;i<(int)gas.size();i++) {
            long long delta=(long long)gas[i]-cost[i];
            total+=delta; tank+=delta;
            if(tank<0) {tank=0; start=i+1;}
        }
        return total<0 ? -1 : start;
    }
};
