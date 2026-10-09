class Solution:
    def solve(self, dimensions):
        n = max(0, len(dimensions)-1)
        if n < 2:
            return 0
        d = [[0]*n for _ in range(n)]
        for length in range(2, n+1):
            for left in range(n-length+1):
                right = left+length-1
                d[left][right] = min(d[left][k]+d[k+1][right]+dimensions[left]*dimensions[k+1]*dimensions[right+1] for k in range(left, right))
        return d[0][-1]
