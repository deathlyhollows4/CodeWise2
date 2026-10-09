class Solution:
    def solve(self, source, target):
        d = [0]*(len(target)+1)
        d[0] = 1
        for c in source:
            for j in range(len(target), 0, -1):
                if c == target[j-1]:
                    d[j] = (d[j]+d[j-1])%1000000007
        return d[-1]
