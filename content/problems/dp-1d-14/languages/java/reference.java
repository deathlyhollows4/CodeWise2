class Solution {
    public long solve(int[] values) {
        long low = values[0], high = low, best = high;
        for (int i = 1; i < values.length; i++) {
            long value = values[i], a = low * value, b = high * value;
            low = Math.min(value, Math.min(a, b));
            high = Math.max(value, Math.max(a, b));
            best = Math.max(best, high);
        }
        return best;
    }
}
