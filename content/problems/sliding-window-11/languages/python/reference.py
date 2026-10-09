class Solution:
    def solve(self, values, k):
        counts={}
        left=0
        best=len(values)+1
        for right,value in enumerate(values):
            counts[value]=counts.get(value,0)+1
            while len(counts)>=k:
                best=min(best,right-left+1)
                old=values[left];left+=1
                counts[old]-=1
                if counts[old]==0:
                    del counts[old]
        return 0 if best>len(values) else best
