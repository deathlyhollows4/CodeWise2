class Solution {
    static class Node { Node[] child = new Node[26]; int count; }
    public int[] solve(String[] dictionary, String[] queries) {
        Node root = new Node();
        for (String word : dictionary) {
            Node node = root;
            for (int i = 0; i < word.length(); i++) {
                int letter = word.charAt(i) - 'a';
                if (node.child[letter] == null) node.child[letter] = new Node();
                node = node.child[letter];
                node.count++;
            }
        }
        int[] scores = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            Node node = root;
            for (int j = 0; j < queries[i].length(); j++) {
                node = node.child[queries[i].charAt(j) - 'a'];
                if (node == null) break;
                scores[i] += node.count;
            }
        }
        return scores;
    }
}
