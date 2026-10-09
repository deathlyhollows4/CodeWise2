class Solution:
    def solve(self, values):
        result=0
        for bit in range(32):
            count=sum((value>>bit)&1 for value in values)
            if count%3:
                result|=1<<bit
        return result-(1<<32) if result>=1<<31 else result
