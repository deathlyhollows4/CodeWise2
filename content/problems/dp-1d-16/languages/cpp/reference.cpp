class Solution {
public:
    int solve(string text, vector<string> words) {
        vector<int> cost(text.size()+1, text.size()+1);
        cost[0] = 0;
        for (int i = 0; i < (int) text.size(); ++i) {
            cost[i+1] = min(cost[i+1], cost[i]+1);
            for (const string& word : words) if (text.compare(i, word.size(), word) == 0)
                cost[i+word.size()] = min(cost[i+word.size()], cost[i]);
        }
        return cost[text.size()];
    }
};
