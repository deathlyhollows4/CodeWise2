class Solution:
    def solve(self, values):
        total=sum(values)
        left=0
        for k in range(1,len(values)):
            left+=values[k-1]
            if left==total-left:
                return k
        return -1
