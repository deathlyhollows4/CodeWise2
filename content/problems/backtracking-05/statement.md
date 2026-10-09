## A limited stock of denominations

The strictly increasing positive denominations `values` have available quantities in the parallel array `stock`. Return every quantity vector that reaches `target`: the count at position i must lie between zero and `stock[i]`, inclusive, and the sum of `values[i] * count[i]` must equal target.

Each answer has one count for each denomination, including zero counts. Sort the answer vectors lexicographically by these counts. Different purchase orders with the same quantity vector are one answer. You cannot reuse more units than the stock allows. Negative targets have no answer. For target zero, the all-zero vector is the one answer; when both input arrays are empty this is `[[]]`.

### Native interface

`solve(values, stock, target)` receives two native integer arrays and a wide signed target, returning an integer matrix. The arrays have equal lengths. Accumulate products and totals in a wide integer; a legal total can exceed a 32-bit signed integer.
