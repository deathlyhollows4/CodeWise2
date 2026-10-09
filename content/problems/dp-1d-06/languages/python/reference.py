class Solution:
    def solve(self, coins, amount):
        best = [amount+1]*(amount+1)
        best[0] = 0
        for total in range(1, amount+1):
            for coin in coins:
                if coin <= total:
                    best[total] = min(best[total], best[total-coin]+1)
        return -1 if best[amount] > amount else best[amount]
