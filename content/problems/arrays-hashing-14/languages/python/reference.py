class Solution:
    def solve(self, values, target):
        count={0:1}
        prefix=result=0
        for value in values:
            prefix+=value
            result+=count.get(prefix-target,0)
            count[prefix]=count.get(prefix,0)+1
        return result
