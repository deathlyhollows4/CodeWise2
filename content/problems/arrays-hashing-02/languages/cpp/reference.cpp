class Solution { public: long long solve(vector<int> values) { long long result=values[0]; for(int value:values) result=max(result,(long long)value); return result; } };
