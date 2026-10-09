class Solution:
    def solve(self, values):
        ordered=sorted(values)
        left=0
        right=len(values)-1
        while left<len(values) and values[left]==ordered[left]:
            left+=1
        while right>=left and values[right]==ordered[right]:
            right-=1
        return 0 if right<left else right-left+1
