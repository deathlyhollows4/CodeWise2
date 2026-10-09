class Solution {
public:
    string solve(vector<int> digits, int k) {
        vector<int> stack;
        for(int digit:digits) {
            while(k>0 && !stack.empty() && stack.back()>digit) {stack.pop_back(); k--;}
            stack.push_back(digit);
        }
        stack.resize(stack.size()-k);
        string answer;
        bool started=false;
        for(int digit:stack) {
            if(digit!=0) started=true;
            if(started) answer.push_back(char('0'+digit));
        }
        return answer.empty()?"0":answer;
    }
};
