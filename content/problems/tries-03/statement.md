## Score shared beginnings

For each string in queries, consider every nonempty prefix of that query. For each prefix, count how many entries in dictionary begin with it. Add those counts and return one integer score per query.

For dictionary=["a","ab","ab","b"] and query="ab", prefix "a" matches three entries and prefix "ab" matches two, so the score is 3+2=5. Repeated identical dictionary entries are separate occurrences and contribute repeatedly. The empty prefix never contributes.

A query does not need to be a complete dictionary word. With dictionary=["ab"] and query="ac", the score is 1 because prefix "a" matches, even though "ac" does not. Matching starts at the first character, is literal and case-sensitive, and stops contributing after the first missing prefix. Do not use wildcard, substring, subsequence or word-segmentation matching.

## Empty and repeated queries

An empty query scores 0. An empty dictionary gives 0 for every query. Preserve query order and duplicates; each query is independent. No queries means an empty result. All text uses lowercase ASCII letters. Dictionary words are nonempty.

## Typed function

solve(dictionary,queries) receives native string arrays and returns an integer array of the same length as queries. You do not write a parser. A counted Trie stores the number of dictionary occurrences passing through each nonempty prefix node. For each query, add the visited counters until its characters end or a child branch is missing.

Equivalently, each dictionary occurrence contributes the number of initial characters it shares with the query before either word ends or the first mismatch occurs. This is a longest common prefix, not a common subsequence.
