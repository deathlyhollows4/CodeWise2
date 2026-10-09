class Solution:
    def solve(self, a):
        if len(a) <= 1:
            return a[0] if a else 0
        def best(lo, hi):
            previous, total = 0, 0
            for i in range(lo, hi):
                previous, total = total, max(total, previous+a[i])
            return total
        return max(best(0, len(a)-1), best(1, len(a)))
