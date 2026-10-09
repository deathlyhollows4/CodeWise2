class Solution {
public:
    vector<vector<int>> solve(vector<vector<int>> intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> result;
        for (const auto& range : intervals) {
            if (!result.empty() && range[0] <= result.back()[1]) result.back()[1] = max(result.back()[1], range[1]);
            else result.push_back(range);
        }
        return result;
    }
};
