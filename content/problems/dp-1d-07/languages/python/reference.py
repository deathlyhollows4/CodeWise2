class Solution:
    def solve(self, coins, amount):
        counts = [0]*(amount+1)
        counts[0] = 1
        for coin in coins:
            for total in range(coin, amount+1):
                counts[total] = (counts[total]+counts[total-coin])%1000000007
        return counts[amount]
