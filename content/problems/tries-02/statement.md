## Exact-length wildcard lookup

Return true when at least one whole word in `words` matches `pattern`. Lowercase letters match themselves. A question mark `?` matches exactly one lowercase letter, never zero letters or an arbitrary-length suffix. The dictionary word and pattern must have equal lengths. Prefix matches alone do not count.

Dictionary words are nonempty, so an empty pattern returns false. An empty dictionary also returns false. Duplicate dictionary entries have no extra effect.

`solve(words,pattern)` receives a native string array and a string, and returns boolean. All dictionary text is lowercase ASCII; the pattern contains only lowercase letters and `?`. Search Trie child branches when a wildcard occurs and require a terminal node when the pattern ends.
