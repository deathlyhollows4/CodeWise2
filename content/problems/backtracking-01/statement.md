## Ordered digit strings with an exact sum

Return every string of exactly `length` digits chosen from `digits` whose digit sum equals `target`. A digit may be reused at any position. Duplicate entries in digits have no extra effect. Return distinct strings in ascending lexicographic order.

These are strings, not numeric values: keep leading zeroes, and distinguish different orders such as "12" and "21". For length zero and target zero, return one empty string, [""]. Length zero with any other target returns an empty array. When length is positive and digits is empty, no string exists. Digits are nonnegative, so a negative target has no solution.

`solve(digits,length,target)` receives a native integer array and two integers, returning string[]. No number parsing is required. A partial string whose accumulated sum already exceeds a nonnegative target can be pruned.
