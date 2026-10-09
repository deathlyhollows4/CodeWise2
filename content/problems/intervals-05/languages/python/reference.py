class Solution:
    def solve(self, segments):
        changes = {}
        for start, end, weight in segments:
            if start == end:
                continue
            changes[start] = changes.get(start, 0) + weight
            changes[end] = changes.get(end, 0) - weight
        active = best = 0
        for coordinate in sorted(changes):
            active += changes[coordinate]
            best = max(best, active)
        return best
