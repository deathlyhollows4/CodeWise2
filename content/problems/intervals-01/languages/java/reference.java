class Solution {
    public int[][] solve(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> {int c = Integer.compare(a[0], b[0]); return c != 0 ? c : Integer.compare(a[1], b[1]);});
        ArrayList<int[]> result = new ArrayList<>();
        for (int[] range : intervals) {
            if (!result.isEmpty() && range[0] <= result.get(result.size()-1)[1]) {
                int[] last = result.get(result.size()-1); last[1] = Math.max(last[1], range[1]);
            } else result.add(new int[]{range[0], range[1]});
        }
        return result.toArray(new int[0][]);
    }
}
