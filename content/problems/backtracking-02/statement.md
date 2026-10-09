## Exact cardinality and signed total

Return every combination of exactly k distinct original indices whose values sum to target. An entry can be selected at most once. Indices are zero-based. Write each combination in increasing index order, and sort the answer combinations lexicographically by those index lists. Equal values at different positions remain different choices.

Values may be negative or zero. Do not discard a branch merely because its current sum exceeds target; a later negative value may restore the required total. For k=0 and target=0, return one empty combination, [[]]. For k=0 and any other target, return an empty array.

`solve(values,k,target)` receives a native integer array, an integer cardinality and a wide signed target, returning int[][]. Return index combinations, not just a feasibility flag, count, or list of selected values. Accumulate totals with a wide integer.
