class Solution {
public:
    long long solve(long long word, int low, int high) {
        int width=high-low+1;
        unsigned long long mask=(1ULL<<width)-1;
        return ((unsigned long long)word>>low)&mask;
    }
};
