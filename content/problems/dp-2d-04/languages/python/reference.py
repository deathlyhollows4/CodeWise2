class Solution:
    def solve(self, a, b):
        d = list(range(len(b)+1))
        for i in range(1, len(a)+1):
            old, d[0] = d[0], i
            for j in range(1, len(b)+1):
                above = d[j]
                d[j] = min(above+1, d[j-1]+1, old+(a[i-1] != b[j-1]))
                old = above
        return d[-1]
