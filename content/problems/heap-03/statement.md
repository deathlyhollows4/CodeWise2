feeds contains sorted event timestamps from several sources. Find a closed range [left, right] that contains at least one event from every feed. Minimize right - left. If several ranges have the same minimum width, return the one with the smallest left endpoint. Return an empty array if any feed is empty.

Duplicate timestamps are allowed. You may use the same timestamp value to satisfy several feeds when each feed contains it. A point range has width zero. Input feeds are already sorted in nondecreasing order. The result contains timestamp values, not positions or feed identifiers.
