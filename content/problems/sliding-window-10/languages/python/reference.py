class Solution:
    def solve(self, values, k):
        counts={}
        left=best=0
        for right,value in enumerate(values):
            counts[value]=counts.get(value,0)+1
            while len(counts)>k:
                old=values[left];left+=1
                counts[old]-=1
                if counts[old]==0:
                    del counts[old]
            best=max(best,right-left+1)
        return best
