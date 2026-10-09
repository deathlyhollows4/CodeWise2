class Solution {
public:
    vector<vector<int>> solve(vector<int> left, vector<int> right, int k) {
        using Item = tuple<long long, int, int>;
        priority_queue<Item, vector<Item>, greater<Item>> queue;
        if (!right.empty()) for (int i = 0; i < min(k, (int)left.size()); i++) queue.emplace((long long)left[i] + right[0], i, 0);
        vector<vector<int>> result;
        while (!queue.empty() && (int)result.size() < k) {
            auto [sum, i, j] = queue.top(); queue.pop();
            result.push_back({i, j});
            if (j + 1 < (int)right.size()) queue.emplace((long long)left[i] + right[j + 1], i, j + 1);
        }
        return result;
    }
};
