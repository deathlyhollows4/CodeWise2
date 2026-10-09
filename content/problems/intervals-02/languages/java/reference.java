class Solution {
    public int[][] solve(int[][] left, int[][] right) {
        ArrayList<int[]> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < left.length && j < right.length) {
            int start = Math.max(left[i][0], right[j][0]);
            int end = Math.min(left[i][1], right[j][1]);
            if (start <= end) result.add(new int[]{start, end});
            if (left[i][1] < right[j][1]) i++; else j++;
        }
        return result.toArray(new int[0][]);
    }
}
