## Restore the separators

You receive a string containing only decimal digits. Insert exactly three dots to form four nonempty segments. Each segment must be a canonical decimal integer from 0 through 255: the single digit "0" is valid, but "00" and "01" are not. Use every input digit exactly once and preserve their order.

Return every valid dotted string, sorted lexicographically as strings. Do not return duplicate answers. Sorting is lexical, not sorting by the numeric octets. If no valid segmentation exists, return an empty array. The empty input also returns an empty array.

### Native interface

`solve(digits)` receives a native string and returns a string array. You do not parse network packets or validate a preformatted dotted address; the task is to choose the missing boundaries. Consider how many digits the remaining segments can consume before exploring a branch.
