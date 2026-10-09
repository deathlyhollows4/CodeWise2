class Solution { public: long long solve(vector<int> values) { unordered_set<int> seen; for(int i=0;i<(int)values.size();i++) if(!seen.insert(values[i]).second) return i; return -1; } };
