class Solution:
    def solve(self, values):
        left,right,best=0,len(values)-1,0
        while left<right:
            best=max(best,(right-left)*min(values[left],values[right]))
            if values[left]<=values[right]:
                left+=1
            else:
                right-=1
        return best
