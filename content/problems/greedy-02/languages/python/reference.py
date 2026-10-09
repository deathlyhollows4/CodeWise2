class Solution:
    def solve(self, gas, cost):
        if not gas:
            return -1
        total = tank = start = 0
        for i in range(len(gas)):
            delta = gas[i]-cost[i]
            total += delta
            tank += delta
            if tank < 0:
                tank = 0
                start = i+1
        return -1 if total < 0 else start
