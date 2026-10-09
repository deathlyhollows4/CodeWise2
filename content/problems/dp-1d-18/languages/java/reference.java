class Solution {
    public int solve(String text) {
        if (text.isEmpty()) return 0;
        boolean[] pal = new boolean[text.length()];
        int[] pieces = new int[text.length()+1];
        java.util.Arrays.fill(pieces, text.length()+1);
        pieces[0] = 0;
        for (int end = 0; end < text.length(); end++) {
            for (int left = 0; left <= end; left++) {
                pal[left] = text.charAt(left) == text.charAt(end) && (end-left < 2 || pal[left+1]);
                if (pal[left]) pieces[end+1] = Math.min(pieces[end+1], pieces[left]+1);
            }
        }
        return pieces[text.length()]-1;
    }
}
