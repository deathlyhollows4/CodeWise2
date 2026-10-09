class Solution {
    struct Node {
        array<int,26> child;
        int count = 0;
        Node() { child.fill(-1); }
    };
public:
    vector<int> solve(vector<string> dictionary, vector<string> queries) {
        vector<Node> trie(1);
        for (const string& word : dictionary) {
            int node = 0;
            for (char c : word) {
                int letter = c - 'a';
                if (trie[node].child[letter] == -1) {
                    int next = static_cast<int>(trie.size());
                    trie[node].child[letter] = next;
                    trie.emplace_back();
                }
                node = trie[node].child[letter];
                trie[node].count++;
            }
        }
        vector<int> scores(queries.size(),0);
        for (size_t i = 0; i < queries.size(); i++) {
            int node = 0;
            for (char c : queries[i]) {
                node = trie[node].child[c-'a'];
                if (node == -1) break;
                scores[i] += trie[node].count;
            }
        }
        return scores;
    }
};
