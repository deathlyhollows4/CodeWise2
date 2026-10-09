class Solution:
    def solve(self, values, k):
        counts={}
        best=0
        for i,value in enumerate(values):
            counts[value]=counts.get(value,0)+1
            if i>=k:
                old=values[i-k]
                counts[old]-=1
                if counts[old]==0:
                    del counts[old]
            if i>=k-1:
                best=max(best,len(counts))
        return best
