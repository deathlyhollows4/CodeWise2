## Shortest known root

For each word in `words`, find dictionary entries in `roots` that are prefixes of that word. Replace the word with the shortest matching entry. If no entry matches, keep the original word. Preserve word order and duplicates. An empty word stays empty because dictionary roots are nonempty. Duplicate roots have no extra effect.

Match from the beginning of the word only. A root appearing later inside a word does not match. If both a short and a longer root match, always choose the short one, even when the longer one equals the whole word.

`solve(roots,words)` receives two native string arrays and returns a string array of the same length as words. All text is lowercase ASCII. No sentence splitting or punctuation parsing is required. A Trie can stop at the first terminal prefix while following a word’s letters.
