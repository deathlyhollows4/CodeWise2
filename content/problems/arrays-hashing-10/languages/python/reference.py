class Solution:
    def solve(self, values):
        out=[1]*len(values)
        left=right=1
        for i,value in enumerate(values):
            out[i]*=left
            left*=value
        for i in range(len(values)-1,-1,-1):
            out[i]*=right
            right*=values[i]
        return out
