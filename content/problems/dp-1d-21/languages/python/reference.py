class Solution:
    def solve(self, prices):
        hold = sold = float('-inf')
        rest = 0
        for price in prices:
            hold, sold, rest = max(hold, rest-price), hold+price, max(rest, sold)
        return max(rest, sold)
