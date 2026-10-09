class Solution:
    def solve(self, values):
        seen=set(values)
        best=0
        for value in seen:
            if value-1 not in seen:
                count=1
                while value+count in seen:
                    count+=1
                best=max(best,count)
        return best
