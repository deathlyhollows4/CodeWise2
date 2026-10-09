class Solution {
    public int[][] solve(int[] left, int[] right, int k) {
        PriorityQueue<int[]> queue = new PriorityQueue<>((a, b) -> {
            long x = (long) left[a[0]] + right[a[1]], y = (long) left[b[0]] + right[b[1]];
            int order = Long.compare(x, y);
            if (order != 0) return order;
            if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
            return Integer.compare(a[1], b[1]);
        });
        if (right.length > 0) for (int i = 0; i < Math.min(k, left.length); i++) queue.offer(new int[]{i, 0});
        ArrayList<int[]> result = new ArrayList<>();
        while (!queue.isEmpty() && result.size() < k) {
            int[] pair = queue.poll(); result.add(pair);
            if (pair[1] + 1 < right.length) queue.offer(new int[]{pair[0], pair[1] + 1});
        }
        return result.toArray(new int[0][]);
    }
}
