class Solution {
public:
    long long solve(vector<vector<int>> segments) {
        map<int,long long> changes;
        for(auto range:segments){if(range[0]==range[1])continue;changes[range[0]]+=range[2];changes[range[1]]-=(long long)range[2];}
        long long active=0,best=0;for(auto [coordinate,change]:changes){active+=change;best=max(best,active);}
        return best;
    }
};
