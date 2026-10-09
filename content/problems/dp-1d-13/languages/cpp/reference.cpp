class Solution {
public:
    long long solve(vector<int> values) {
        long long ending = values[0], best = ending;
        for (int i = 1; i < (int) values.size(); ++i) {
            ending = max((long long) values[i], ending + values[i]);
            best = max(best, ending);
        }
        return best;
    }
};
