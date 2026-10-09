class Solution:
    def solve(self, text, words):
        cost = [len(text)+1]*(len(text)+1)
        cost[0] = 0
        for i in range(len(text)):
            cost[i+1] = min(cost[i+1], cost[i]+1)
            for word in words:
                if text.startswith(word, i):
                    cost[i+len(word)] = min(cost[i+len(word)], cost[i])
        return cost[-1]
