class Solution {
public:
    long long solve(vector<int> values) {
        long long low = values[0], high = low, best = high;
        for (int i = 1; i < (int) values.size(); ++i) {
            long long value = values[i], a = low * value, b = high * value;
            low = min(value, min(a, b));
            high = max(value, max(a, b));
            best = max(best, high);
        }
        return best;
    }
};
