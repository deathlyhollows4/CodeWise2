class Solution:
    def solve(self, word, low, high):
        width = high - low + 1
        return (word >> low) & ((1 << width) - 1)
