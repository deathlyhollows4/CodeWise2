class Solution {
    public int solve(String text) {
        boolean[] pal = new boolean[text.length()];
        int count = 0;
        for (int end = 0; end < text.length(); end++) {
            for (int left = 0; left <= end; left++) {
                pal[left] = text.charAt(left) == text.charAt(end) && (end-left < 2 || pal[left+1]);
                if (pal[left]) count++;
            }
        }
        return count;
    }
}
