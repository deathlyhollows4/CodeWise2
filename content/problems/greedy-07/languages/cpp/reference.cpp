class Solution {
public:
    string solve(string text) {
        vector<int> last(26,0);
        for(int i=0;i<(int)text.size();i++) last[text[i]-'a']=i;
        vector<bool> used(26,false);
        string stack;
        for(int i=0;i<(int)text.size();i++) {
            char c=text[i];
            if(used[c-'a']) continue;
            while(!stack.empty() && stack.back()>c && last[stack.back()-'a']>i) {
                used[stack.back()-'a']=false; stack.pop_back();
            }
            stack.push_back(c); used[c-'a']=true;
        }
        return stack;
    }
};
