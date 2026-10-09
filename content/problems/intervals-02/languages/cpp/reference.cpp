class Solution {
public:
    vector<vector<int>> solve(vector<vector<int>> left, vector<vector<int>> right) {
        vector<vector<int>> result;
        int i = 0, j = 0;
        while (i < (int)left.size() && j < (int)right.size()) {
            int start = max(left[i][0], right[j][0]), end = min(left[i][1], right[j][1]);
            if (start <= end) result.push_back({start, end});
            if (left[i][1] < right[j][1]) i++; else j++;
        }
        return result;
    }
};
