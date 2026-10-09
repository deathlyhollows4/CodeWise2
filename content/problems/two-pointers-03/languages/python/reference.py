class Solution:
    def solve(self, values):
        result=[0]*len(values)
        write=0
        for value in values:
            if value!=0:
                result[write]=value
                write+=1
        return result
