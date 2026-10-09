class Solution:
    def solve(self, values, target):
        keep=sum(values)-target
        if keep<0:
            return -1
        left,total,best=0,0,(0 if keep==0 else -1)
        for right,value in enumerate(values):
            total+=value
            while left<=right and total>keep:
                total-=values[left];left+=1
            if total==keep:
                best=max(best,right-left+1)
        return -1 if best<0 else len(values)-best
