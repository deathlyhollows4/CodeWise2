## All dictionary words on the board

Return every distinct entry from `words` that can be formed on `board`. Start at any cell and move to a horizontally or vertically adjacent cell for each next letter. Do not move diagonally, wrap around an edge, or reuse a cell within one word path. A one-letter word may use one matching cell.

Paths for different words are independent: finding one word does not consume its cells. Duplicate dictionary entries produce one result. A found word may be a prefix of a longer found word, so keep exploring its Trie branch. Return the found words in ascending lexicographic order. An empty board or dictionary returns an empty array.

### Native interface

`solve(board,words)` receives two native string arrays. board contains equal-length row strings; words contains the dictionary. All letters are lowercase ASCII. Return string[]. No character-table parsing is required. Build one Trie for the dictionary and search viable prefixes while tracking cells used on the current path.
