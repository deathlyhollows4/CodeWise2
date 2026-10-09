class Solution {
public:
    int solve(string text) {
        vector<bool> pal(text.size(), false);
        int count = 0;
        for (int end = 0; end < (int) text.size(); ++end) {
            for (int left = 0; left <= end; ++left) {
                pal[left] = text[left] == text[end] && (end-left < 2 || pal[left+1]);
                if (pal[left]) count++;
            }
        }
        return count;
    }
};
