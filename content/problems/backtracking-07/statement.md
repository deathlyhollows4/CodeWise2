## Four digits in each scope

Complete the 4×4 grid using digits 1 through 4. A zero in `clues` is an empty cell; every nonzero clue is fixed. Each row, each column, and each of the four 2×2 blocks must contain every digit exactly once. Contradictory fixed clues are valid input, but their answer is an empty array.

Return every valid completed grid. Represent one grid by four row strings, each containing four digits. Sort the completed grids lexicographically by their 16 row-major digits. Do not change a fixed clue or return a partial grid. If the input is already complete and valid, return it as the one answer.

### Native interface

`solve(clues)` receives a native integer matrix and returns a native string matrix: the outer array lists solutions, and each solution has its four row strings. There is no JSON parsing task. Restore row, column and block state when a search branch finishes.
