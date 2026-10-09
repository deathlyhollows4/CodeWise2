class Solution:
    def solve(self, values):
        from bisect import bisect_left
        tails = []
        for value in values:
            position = bisect_left(tails, value)
            if position == len(tails):
                tails.append(value)
            else:
                tails[position] = value
        return len(tails)
