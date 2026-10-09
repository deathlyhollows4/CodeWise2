class Solution:
    def solve(self, values, limit):
        left=total=count=0
        for right,value in enumerate(values):
            total+=value
            while total>limit:
                total-=values[left];left+=1
            count+=right-left+1
        return count
