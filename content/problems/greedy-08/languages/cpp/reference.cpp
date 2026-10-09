class Solution {
public:
    long long solve(vector<int> weights) {
        sort(weights.begin(),weights.end());
        vector<long long> merged;
        int i=0,j=0;
        long long total=0;
        for(int step=1;step<(int)weights.size();step++) {
            long long sum=0;
            for(int pick=0;pick<2;pick++) {
                if(i<(int)weights.size() && (j>=(int)merged.size() || weights[i]<=merged[j])) sum+=weights[i++];
                else sum+=merged[j++];
            }
            merged.push_back(sum); total+=sum;
        }
        return total;
    }
};
