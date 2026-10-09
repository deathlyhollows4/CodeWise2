class Solution:
    def solve(self, values, lo, hi):
        def bound(target, strict):
            left, right = 0, len(values)
            while left < right:
                mid = left+(right-left)//2
                if values[mid] < target or (strict and values[mid] == target):
                    left = mid+1
                else:
                    right = mid
            return left
        return bound(hi, True)-bound(lo, False)
