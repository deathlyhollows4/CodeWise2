class Solution:
    def solve(self, values, target):
        total = sum(values)
        if abs(target) > total or (total+target)%2:
            return 0
        wanted = (total+target)//2
        ways = [0]*(wanted+1)
        ways[0] = 1
        for value in values:
            for n in range(wanted, value-1, -1):
                ways[n] = (ways[n]+ways[n-value])%1000000007
        return ways[wanted]
