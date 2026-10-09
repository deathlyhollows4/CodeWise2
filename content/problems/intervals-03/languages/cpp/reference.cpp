class Solution {
public:
    vector<int> solve(vector<vector<int>> blocked, int lo, int hi, int duration) {
        sort(blocked.begin(), blocked.end());
        long long cursor = lo;
        for (auto interval : blocked) {
            long long start = max(lo, interval[0]), end = min(hi, interval[1]);
            if (start >= end) continue;
            if (start - cursor >= duration) return {(int)cursor, (int)(cursor + duration)};
            cursor = max(cursor, end);
        }
        return (long long)hi - cursor >= duration ? vector<int>{(int)cursor, (int)(cursor + duration)} : vector<int>{};
    }
};
