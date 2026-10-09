class Solution {
    public boolean solve(String text, String[] words) {
        boolean[] reachable = new boolean[text.length()+1];
        reachable[0] = true;
        for (int i = 0; i < text.length(); i++) if (reachable[i])
            for (String word : words) if (text.startsWith(word, i))
                reachable[i+word.length()] = true;
        return reachable[text.length()];
    }
}
