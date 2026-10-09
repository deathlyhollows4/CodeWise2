class Solution:
    def solve(self, values, target):
        first={}
        result=[-1,-1]
        for j,value in enumerate(values):
            i=first.get(target-value)
            if i is not None and (result[0]<0 or i<result[0]):
                result=[i,j]
            first.setdefault(value,j)
        return result
