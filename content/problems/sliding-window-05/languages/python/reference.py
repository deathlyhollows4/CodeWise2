class Solution:
    def solve(self, values, k):
        left=zeros=best=0
        for right,value in enumerate(values):
            zeros+=int(value==0)
            while zeros>k:
                zeros-=int(values[left]==0);left+=1
            best=max(best,right-left+1)
        return best
