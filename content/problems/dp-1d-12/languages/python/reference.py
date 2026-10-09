class Solution:
    def solve(self, a):
        n = len(a)
        if not n:
            return 0
        lengths, ways = [1]*n, [1]*n
        best = 1
        for i in range(n):
            for j in range(i):
                if a[j] < a[i]:
                    if lengths[j]+1 > lengths[i]:
                        lengths[i], ways[i] = lengths[j]+1, ways[j]
                    elif lengths[j]+1 == lengths[i]:
                        ways[i] = (ways[i]+ways[j])%1000000007
            best = max(best, lengths[i])
        return sum(ways[i] for i in range(n) if lengths[i] == best)%1000000007
