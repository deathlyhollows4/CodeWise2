## Replay the cache history

Process commands for a least-recently-used cache with the supplied capacity. A get reads a key and makes a present entry most recently used. A put inserts or updates a key and also makes it most recently used. When inserting beyond capacity, evict the least recently used entry.

## Your function

`solve(capacity, commands, keys, values)` receives an integer and three ordinary typed arrays of equal length. Command i uses keys[i]. A put stores values[i]; a get ignores that value slot. Commands are exactly get or put, so no parsing or unknown-command handling is needed in your solution.

Return an integer array with one result per command: put returns 0; get returns the stored value or -1 when absent. Values are nonnegative, so -1 means missing. Capacity 0 stores nothing. Updating an existing key must not create a second entry or evict an unrelated entry.

## Complexity target

Aim for O(1) expected work per operation with a hash lookup and linked recency order. Each call starts with an empty cache. Return native arrays/lists for your language; do not write a JSON parser.
