class Solution:
    def solve(self, values, target):
        reachable = [False]*(target+1)
        reachable[0] = True
        for value in values:
            for total in range(target, value-1, -1):
                reachable[total] = reachable[total] or reachable[total-value]
        return reachable[target]
