class Solution {
    public long solve(long word, int low, int high) {
        int width=high-low+1;
        long mask=(1L<<width)-1;
        return (word>>>low)&mask;
    }
}
