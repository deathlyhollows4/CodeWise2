class Solution {
public:
    int solve(string text) {
        if (text.empty()) return 0;
        vector<bool> pal(text.size(), false);
        vector<int> pieces(text.size()+1, text.size()+1);
        pieces[0] = 0;
        for (int end = 0; end < (int) text.size(); ++end) {
            for (int left = 0; left <= end; ++left) {
                pal[left] = text[left] == text[end] && (end-left < 2 || pal[left+1]);
                if (pal[left]) pieces[end+1] = min(pieces[end+1], pieces[left]+1);
            }
        }
        return pieces[text.size()]-1;
    }
};
