class Solution:
    def solve(self, blocked, lo, hi, duration):
        cursor = lo
        for start, end in sorted(blocked):
            start, end = max(lo, start), min(hi, end)
            if start >= end:
                continue
            if start - cursor >= duration:
                return [cursor, cursor + duration]
            cursor = max(cursor, end)
        return [cursor, cursor + duration] if hi - cursor >= duration else []
