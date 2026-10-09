## Keep the fixed delimiters

The pattern contains only `(`, `)`, and `?`. Replace each question mark with exactly one opening or closing parenthesis. Preserve every fixed character. Return all resulting balanced strings, in lexicographic order. A string is balanced when every prefix contains at least as many opening as closing parentheses and the total counts are equal.

A question mark cannot disappear, become several characters, or turn into a different bracket type. Return an empty array if no completion exists. The empty pattern has one empty completion, `[""]`. An odd-length pattern has no balanced completion.

### Native interface

`solve(pattern)` receives a native string and returns a string array. Restore the current path when returning from a branch. Think about both a negative current balance and an opening balance too large for the remaining positions to close.
