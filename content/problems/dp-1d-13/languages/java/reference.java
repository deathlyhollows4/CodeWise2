class Solution {
    public long solve(int[] values) {
        long ending = values[0], best = ending;
        for (int i = 1; i < values.length; i++) {
            ending = Math.max((long) values[i], ending + values[i]);
            best = Math.max(best, ending);
        }
        return best;
    }
}
