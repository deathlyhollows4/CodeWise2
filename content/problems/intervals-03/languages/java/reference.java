class Solution {
    public int[] solve(int[][] blocked, int lo, int hi, int duration) {
        Arrays.sort(blocked, (a,b) -> Integer.compare(a[0],b[0]));
        long cursor = lo;
        for (int[] interval : blocked) {
            long start = Math.max(lo, interval[0]), end = Math.min(hi, interval[1]);
            if (start >= end) continue;
            if (start - cursor >= duration) return new int[]{(int)cursor, (int)(cursor + duration)};
            cursor = Math.max(cursor, end);
        }
        return (long)hi - cursor >= duration ? new int[]{(int)cursor, (int)(cursor + duration)} : new int[0];
    }
}
