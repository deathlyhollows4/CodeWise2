## Position-specific permissions

There are n items, identified by the distinct original IDs 0 through n−1, and n positions. The square matrix `allowed` has one row per position and one column per item. A value of 1 means that item may occupy that position; 0 forbids it.

Return every full permutation of the item IDs satisfying all permissions. Every item must appear exactly once. Each returned row lists the item occupying positions 0, 1, …, n−1. Sort the result rows lexicographically by item IDs. Do not collapse items by any imagined value, reuse an item, or return only a count. For n=0, return one empty permutation, `[[]]`. If the permissions make a full assignment impossible, return an empty array.

### Native interface

`solve(allowed)` receives a native square integer matrix and returns an integer matrix. Permissions are read as `allowed[position][item]`, not in the reverse direction. Explore permitted choices while keeping used-item state private to the current branch.
