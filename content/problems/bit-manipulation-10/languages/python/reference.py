class Solution:
    def solve(self, initial, positions):
        for position in positions:
            initial ^= 1<<position
        return initial
