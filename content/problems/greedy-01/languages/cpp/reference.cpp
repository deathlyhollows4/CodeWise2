class Solution {
public:
    int solve(vector<int> values) {
        if(values.size()<2) return 0;
        int far=0,boundary=0,count=0;
        for(int i=0;i<(int)values.size()-1;i++) {
            far=max(far,i+values[i]);
            if(i==boundary) {
                if(far<=i) return -1;
                count++; boundary=far;
                if(boundary>=(int)values.size()-1) return count;
            }
        }
        return -1;
    }
};
