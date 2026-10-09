class Solution {
public:
    int solve(vector<int> values) {
        if(values.empty()) return 0;
        int up=1,down=1;
        for(int i=1;i<(int)values.size();i++) {
            if(values[i]>values[i-1]) up=down+1;
            else if(values[i]<values[i-1]) down=up+1;
        }
        return max(up,down);
    }
};
