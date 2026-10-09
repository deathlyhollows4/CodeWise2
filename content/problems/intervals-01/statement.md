Each [start, end] row covers every real position from start through end, including both endpoints. Return the same covered set using sorted ranges that do not overlap or touch. Merge touching ranges because their shared endpoint connects them.

Input rows may arrive in any order. Repeated identical rows have no extra effect. A row [x, x] covers the single point x and must not be discarded. Empty input returns an empty matrix.

For example, [1, 2] and [3, 4] remain separate: there are uncovered real positions between 2 and 3. Return ranges in ascending start order.
