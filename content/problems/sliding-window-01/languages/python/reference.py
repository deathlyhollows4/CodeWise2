class Solution:
    def solve(self, values, k):
        total=sum(values[:k])
        best=total
        for right in range(k,len(values)):
            total+=values[right]-values[right-k]
            best=max(best,total)
        return best
