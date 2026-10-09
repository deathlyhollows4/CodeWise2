class Solution {
    public int solve(String text, String[] words) {
        int[] cost = new int[text.length()+1];
        java.util.Arrays.fill(cost, text.length()+1);
        cost[0] = 0;
        for (int i = 0; i < text.length(); i++) {
            cost[i+1] = Math.min(cost[i+1], cost[i]+1);
            for (String word : words) if (text.startsWith(word, i))
                cost[i+word.length()] = Math.min(cost[i+word.length()], cost[i]);
        }
        return cost[text.length()];
    }
}
