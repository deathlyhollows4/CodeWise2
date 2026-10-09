class Solution:
    def solve(self, a, b, target):
        if len(a)+len(b) != len(target):
            return False
        d = [False]*(len(b)+1)
        d[0] = True
        for j in range(1, len(b)+1):
            d[j] = d[j-1] and b[j-1] == target[j-1]
        for i in range(1, len(a)+1):
            d[0] = d[0] and a[i-1] == target[i-1]
            for j in range(1, len(b)+1):
                d[j] = (d[j] and a[i-1] == target[i+j-1]) or (d[j-1] and b[j-1] == target[i+j-1])
        return d[-1]
