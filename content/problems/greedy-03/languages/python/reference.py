class Solution:
    def solve(self, ratings):
        amount = [1]*len(ratings)
        for i in range(1, len(ratings)):
            if ratings[i] > ratings[i-1]:
                amount[i] = amount[i-1]+1
        for i in range(len(ratings)-2, -1, -1):
            if ratings[i] > ratings[i+1]:
                amount[i] = max(amount[i], amount[i+1]+1)
        return sum(amount)
