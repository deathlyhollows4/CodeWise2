class Solution:
    def solve(self, lo, hi):
        composite=[False]*(hi+1)
        for d in range(2, int(hi**0.5)+1):
            if not composite[d]:
                for p in range(d*d,hi+1,d): composite[p]=True
        return sum(not composite[n] for n in range(max(2,lo),hi+1))
