class Solution:
    def solve(self, values, target):
        left=total=0
        best=len(values)+1
        for right,value in enumerate(values):
            total+=value
            while total>=target:
                best=min(best,right-left+1)
                total-=values[left];left+=1
        return 0 if best>len(values) else best
