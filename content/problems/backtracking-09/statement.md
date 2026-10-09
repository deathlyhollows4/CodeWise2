## Respect the board and the fixed queens

Place one queen in every row of the n×n board. `allowed[row][column]` is 1 for an available square and 0 for a blocked square. `fixed[row]` is −1 when that row has no fixed queen; otherwise it is the column where that row must place its queen. A fixed queen on a blocked square makes the instance impossible. Fixed constraints that attack each other also make it impossible.

No two queens may share a column or either diagonal. Return every valid arrangement as an array of n columns: the entry at row r is that row’s queen column. Sort arrangement rows lexicographically by these column arrays. Return an empty array when no arrangement exists. The empty board has one empty arrangement, `[[]]`.

### Native interface

`solve(allowed, fixed)` receives a native square integer matrix and a native integer array of equal length, returning an integer matrix. Columns and rows use zero-based indices. Do not alter the board or relax a fixed constraint.
