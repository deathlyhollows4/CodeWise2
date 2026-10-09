class Solution {
public:
    bool solve(string text, vector<string> words) {
        vector<bool> reachable(text.size()+1, false);
        reachable[0] = true;
        for (int i = 0; i < (int) text.size(); ++i) if (reachable[i])
            for (const string& word : words) if (text.compare(i, word.size(), word) == 0)
                reachable[i+word.size()] = true;
        return reachable[text.size()];
    }
};
